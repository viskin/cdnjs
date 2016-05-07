'use strict';

!function(){
    if(!console){
        console = {
            log: function(){},
            error: function(){}
        }
    }

    var Rimg = function() {
        var hidden = {
            status : 'init',
            observer : null,
            breakpoints : [],
            resizeWait: null,
            resizeDimensions: '',
            disableIntrospection: false
        };

        function parseBreakpoints(value){
            //custom: (once) -small 640w 1x, -retina-small 640w 2x, -medium 1280w 1x, -retina-medium 1280w 2x
            //custom: (per image) data-src="image.jpg"
            if(typeof value === 'string'){
                var breakpoints = value.split(',');
                if(breakpoints.length === 0){
                    //invalid
                    hidden.status = 'error';
                    console.error('Rimg: your breakpoint-definition '+ value +' is invalid, check the documentation.');
                    return null;
                }
                var definition = [];
                var i = 0;
                var il = breakpoints.length;
                while(i<il){
                    var bp = breakpoints[i];
                    var bpDefinition = {
                        src: [],
                        width: -1,
                        height: -1,
                        pixelRatio: [],
                        getSrc: function(value){
                            var ratios = this.pixelRatio.length;
                            if(ratios === 0){
                                hidden.status = 'error';
                                console.error('Rimg: missing a pixelRatio definition, check the documentation.');
                                return '';
                            }else if(ratios === 1){
                                return this.src[0];
                            }else if(ratios === 2){
                                if(value <= 1){
                                    return this.src[0];
                                }else{
                                    return this.src[1];
                                }
                            }else{
                                //determine which pixelRatio matches most closely with current device pixel ratio.
                                var s = 0;
                                var sl = this.pixelRatio.length;
                                while(s<sl){
                                    //possible that pixelRatio is 1.5 or 2.25
                                    if(value == this.pixelRatio[s] || Math.round(value) == this.pixelRatio[s]){
                                        return this.src[s];
                                    }
                                    s++;
                                }
                                //use last reference
                                return this.src[ratios-1];
                            }
                        }
                    };
                    var parts = bp.split(' ');
                    var p = 0;
                    var pl = parts.length;
                    while(p<pl){
                        var part = parts[p];
                        if(part.replace(' ','') === ''){
                            //ignore, empty = typo
                        }else{
                            if(part.match(/^[0-9]{0,4}w/gi) != null){
                                bpDefinition.width = Number(part.substr(0,part.length-1));
                            }else if(part.match(/^[0-9]{0,4}h/gi) != null){
                                bpDefinition.height = Number(part.substr(0,part.length-1));
                            }else if(part.match(/[0-9]{1}x/gi) != null){
                                bpDefinition.pixelRatio.push(Number(part.substr(0,part.length-1)));
                            }else{
                                bpDefinition.src.push(part);
                            }
                        }
                        p++;
                    }

                    //check if already defined (pixelRatio)
                    var d = 0;
                    var dl = definition.length;
                    var found = false;
                    while(d<dl){
                        var def = definition[d];
                        if((def.width === bpDefinition.width  && def.width != -1) || (def.height === bpDefinition.height && def.height != -1)){
                            //a match
                            def.pixelRatio.push(bpDefinition.pixelRatio[0]);
                            def.src.push(bpDefinition.src[0]);
                            found = true;
                            break;
                        }
                        d++;
                    }
                    if(!found){
                        //new breakpoint definition
                        definition.push(bpDefinition);
                    }

                    i++;
                }
                if(definition.length > 0){
                    return definition;
                }else{
                    hidden.status = 'error';
                    console.error('Rimg: your breakpoint-definition misses valid breakpoints, check the documentation.');
                    return null;
                }
            }else{
                //invalid
                hidden.status = 'error';
                console.error('Rimg: your breakpoint-definition is not a String, check the documentation.');
                return null;
            }
        }

        //discover initial settings
        if(typeof RimgBreakpoint !== 'undefined'){
            //validate
            var bpts = parseBreakpoints(RimgBreakpoint);
            if(bpts != null){
                hidden.breakpoints = bpts;
            }
            //TODO put on window also?
            //clean reference
            RimgBreakpoint = undefined;
        }else{
            console.log('(remark) Rimg: no breakpoints defined, check the documentation.');
        }

        function event(type,evt,func,target){
            //add/remote event listeners
            if(target === undefined){
                target = document;
            }
            if(evt === 'resize'){
                target = window;
            }
            if(type == 'add'){
                target.addEventListener(evt,func,false);
            }else{
                target.removeEventListener(evt,func,false);
            }
        }

        function adjust(value){
            //change src property when appropriate
            //TODO check connection speed - or not? > listener with ms of images (could be slow connection or large image)
            var ratio = window.devicePixelRatio || 1;
            var data = value.getAttribute('data-src');
            if(data != null){
                //only adjust images with data-src property
                var file = data.substr(0,data.lastIndexOf('.'));
                var extension = data.substr(data.lastIndexOf('.'));
                var size = {x:value.width,y:value.height};
                //firefox presents width/height with 0, so check getComputedStyle if necessary:
                if(value.width == 0){
                    size.x = window.getComputedStyle(value,null).maxWidth;
                    size.x = size.x.replace('px','');
                    size.x = Number(size.x);
                }
                if(value.height == 0){
                    size.y = window.getComputedStyle(value,null).maxHeight;
                    size.y = size.y.replace('px','');
                    size.y = Number(size.y);
                }
                var i = 0;
                var il = hidden.breakpoints.length;
                var breakpoint;
                while(i<il){
                    var bp = hidden.breakpoints[i];
                    var wd = size.x;
                    if(size.x < size.y){
                        wd = size.y;
                    }
                    if(wd <= bp.width){
                        breakpoint = bp;
                        break;
                    }
                    i++;
                }
                if(breakpoint === undefined){
                    //use latest
                    breakpoint = hidden.breakpoints[hidden.breakpoints.length-1];
                }

                //TODO check correct width and which breakpoint matches or not?
                //TODO parentElement
    //                console.log('   ',window.getComputedStyle(value).height);
    //                console.log('   ',data,value,value.offsetWidth,'x',value.offsetHeight,' or ',value.scrollWidth,'x',value.scrollHeight,value.clientWidth,'x',value.clientHeight,value.innerWidth,'x',value.innerHeight,value.outerWidth,'x',value.outerHeight,'##',value.width,'x',value.height);
    //                console.log('   ',data,value.parentElement,value.parentElement.offsetWidth,'x',value.parentElement.offsetHeight,' or ',value.parentElement.scrollWidth,'x',value.parentElement.scrollHeight,value.parentElement.clientWidth,'x',value.parentElement.clientHeight,value.parentElement.innerWidth,'x',value.parentElement.innerHeight,value.parentElement.outerWidth,'x',value.parentElement.outerHeight,'##',value.parentElement.width,'x',value.parentElement.height);
                var id = telemetryData.identifier;
                if(value.getAttribute('src') != file+breakpoint.getSrc(ratio)+extension){
                    //set the appropriate version of the image
                    telemetry({type:'start',image:data+id,time:new Date().getTime()});
                    value.setAttribute('src',file+breakpoint.getSrc(ratio)+extension);
                    value.setAttribute('data-telemetry',data+id);
                    event('add','load',telemetryData.done,value);
                    event('add','error',telemetryData.error,value);
                    telemetryData.identifier++;
                }
            }
        }

        function inspect(value){
            //check node itself if it is an image or has children
            if(value.nodeName.toLowerCase() === 'img'){
                adjust(value);
            }else{
                //walk through all node children until you find img files
                var i = 0;
                var il = value.children.length;
                while(i<il){
                    var item = value.children[i];
                    inspect(item);
                    i++;
                }
            }
        }

        function resize(){
            //window is resized, execute checkup, if necessary
            clearInterval(hidden.resizeWait);

            //execute only with different window dimensions (on mobile executed twice!)
            var nw = window.innerWidth+'x'+window.innerHeight;
            if(hidden.resizeDimensions !== nw){
                hidden.resizeDimensions = nw;
                this.execute(document);
            }
        }

        function nodeInserted(e){
            this.execute(e.target);
        }

        function telemetry(value){
            //determine loading time of an image
            if(value.type === 'start'){
                telemetryData.connections[value.image] = value.time;
            }else if(value.type === 'end'){
                if(value.time != null){
                    var diff = Number(value.time) - Number(telemetryData.connections[value.image]);
                    telemetryData.values.push(diff);
                    if(telemetryData.length > 50){
                        telemetryData.shift();
                    }
                }
                delete telemetryData.connections[value.image];
            }else if(value.type === 'debug'){
                if(telemetryData.values.length > 0){
                    console.debug('Rimg:','show all telemetry data (in ms):',telemetryData.values,'connections:',telemetryData.connections);
                }
            }
        }

        //store loading times for bandwidth purposes
        var telemetryData = {
            identifier:0,
            values:[],//in ms!
            connections:{},
            done: function(e){
                telemetry({type:'end',image:e.target.getAttribute('data-telemetry'),time:new Date().getTime()});
                //cleanup listeners
                event('remove','load',telemetryData.done,e.target);
                event('remove','error',telemetryData.done,e.target);
            },
            error: function(e){
                telemetry({type:'end',image:e.target.getAttribute('data-telemetry'),time:null});
                //cleanup listeners
                event('remove','load',telemetryData.done,e.target);
                event('remove','error',telemetryData.done,e.target);
            }
        }

        return {
            version: '0.2.5',
            execute: function(target){
                //only possible when DOM is loaded and no errors appeared
                if(hidden.status === 'error'){
                    console.error('Rimg.execute(): error-status so no actions can be executed, check your code.');
                    return;
                }else if(target === undefined){
                    console.error('Rimg.execute(): undefined value, check your code to add a valid DOM element to this function.');
                    return;
                }
                if(target.nodeName === '#document'){
                    if(target.childNodes.length > 1){
                        //use html node
                        inspect(target.childNodes[1].children[1]);
                    }else{
                        console.error('Rimg.execute(): not a valid DOM representation, check your code.');
                    }
                }else{
                    if(target != undefined && target.nodeName != undefined && target.nodeName.toLowerCase() === 'img'){
                        //direct reference
                        inspect(target);
                    }else if(target[0] != undefined && target[0].nodeName.toLowerCase() === 'img'){
                        //child reference (after add)
                        inspect(target[0]);
                    }else{
                        //no <img> element found
                    }
                }
            },
            configure: function(value){
                var breakpoints = parseBreakpoints(value);
                if(breakpoints != null){
                    hidden.breakpoints = breakpoints;
                }

                if(hidden.status === 'ready' && !hidden.disableIntrospection){
                    //if DOM loaded, execute right away
                    this.execute(document);
                }
            },
            resized: function(e){
                if(hidden.status != 'ready'){
                    //not available anymore
                    return;
                }

                //cleanup
                if(hidden.resizeWait != null){
                    clearInterval(hidden.resizeWait);
                }
                //wait 100ms to ensure performant and not a blocking script execution
                hidden.resizeWait = setInterval(resize.bind(this),100);
            },
            loaded: function(e){
                if(hidden.status != 'progress'){
                    //not available anymore
                    return;
                }

                //cleanup listener
                event('remove','DOMContentLoaded',this.loaded);

                //initial DOM checkup
                if(!hidden.disableIntrospection){
                    // DOM content loaded
                    if (hidden.observer === null) {
                        //TODO double? see some lines below
                        //check the whole page before any changes happen
                        this.execute(e.target);
                    }else{
                        hidden.observer.observe(document.body, {
                            attributes: true,
                            childList: true,
                            characterData: true,
                            subtree: true,
                            attributeFilter: ['data-src']
                        });
                    }

                    //listen for browser resize
                    event('add','resize',this.resized.bind(this));

                    //check full DOM
                    this.execute(document);
                }
                hidden.status = 'ready';
            },
            disableIntrospection: function(){
                hidden.disableIntrospection = true;

                //remove mutation listeners
                if(hidden.observer){
                    hidden.observer.disconnect();
                }else{
                    event('remove','DOMNodeInserted',nodeInserted);
                }
            },
            initialize: function(){
                if(hidden.status != 'init'){
                    if(hidden.status != 'error'){
                        console.error('Rimg.initialize(): Already initialized. No forced initialization supported, check your code.');
                    }
                    return;
                }

                //listen for DOM & change events
                var base = this;
                var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
                if (MutationObserver === undefined) {
                    event('add','DOMAttrModified',function(e){
                        //DOM attribute modified, not supported in webkit
                        //TODO Safari 5.0+ MutationObserver support, Chrome 18
                    });
                    //TODO issues with IE9 - http://help.dottoro.com/ljmcxjla.php
                    event('add','DOMNodeInserted',nodeInserted.bind(base));
                    event('add','DOMSubtreeModified',function(e){
                        //TODO nothing?
                        //console.debug('Rimg:','DOM subtree modified',e.target);
                    });
                }else{
                    hidden.observer = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            if(mutation.addedNodes.length > 0){
                                base.execute(mutation.addedNodes);
                            }else if(mutation.attributeName === 'data-src'){
                                base.execute(mutation.target);
                            }
                        });
                    });
                }
                hidden.status = 'progress';

                // wait until DOM is loaded
                event('add','DOMContentLoaded',this.loaded.bind(this));
            }
        };
    };

    // browser
    window.Rimg = Object.create(Rimg());
    // start listening
    window.Rimg.initialize();
}();