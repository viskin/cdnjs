;(function( window, undefined ){
  'use strict';

angular.module("ct.ui.router.extras", [ 'ui.router' ]);


var forEach = angular.forEach;

var map = function (collection, callback) {
  "use strict";
  var result = [];
  forEach(collection, function (item, index) {
    result.push(callback(item, index));
  });
  return result;
};

var keys = function(collection) {
  "use strict";
  return map(collection, function(collection, key) {
    return key;
  });
};

var filter = function(collection, callback) {
  "use strict";
  var result = [];
  forEach(collection, function(item, index) {
    if (callback(item, index)) {
      result.push(item);
    }
  });
  return result;
};

var filterObj = function(collection, callback) {
  "use strict";
  var result = {};
  forEach(collection, function(item, index) {
    if (callback(item, index)) {
      result[index] = item;
    }
  });
  return result;
};

var DEBUG = false;
//define(['angularAMD'], function (angularAMD) {

  var app = angular.module("ct.ui.router.extras");
  app.service("$deepStateRedirect", function ($rootScope, $state) {
    var lastSubstate = {};
    var lastParams = {};
    var deepStateRedirectsByName = {};

    var REDIRECT = "Redirect", ANCESTOR_REDIRECT = "AncestorRedirect";

    function computeDeepStateStatus(state) {
      var name = state.name;
      if (deepStateRedirectsByName.hasOwnProperty(name))
        return deepStateRedirectsByName[name];
      recordDeepStateRedirectStatus(name);
    }

    function recordDeepStateRedirectStatus(stateName) {
      var state = $state.get(stateName);
      if (state && state.deepStateRedirect === true) {
        deepStateRedirectsByName[stateName] = REDIRECT;
        if (lastSubstate[stateName] === undefined)
          lastSubstate[stateName] = stateName;
      }

      var lastDot = stateName.lastIndexOf(".");
      if (lastDot != -1) {
        var parentStatus = recordDeepStateRedirectStatus(stateName.substr(0, lastDot));
        if (parentStatus && deepStateRedirectsByName[stateName] === undefined) {
          deepStateRedirectsByName[stateName] = ANCESTOR_REDIRECT;
        }
      }
      return deepStateRedirectsByName[stateName] || false;
    }

    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
      function shouldRedirect() {
        var deepStateStatus = computeDeepStateStatus(toState);
        var substate = lastSubstate[toState.name];
        // We're changing directly to one of the redirect (tab) states and we have a last substate recorded 
        return deepStateStatus === REDIRECT && substate && substate != toState.name ? true : false;
      }

      if (shouldRedirect()) { // send them to the last known state for that tab 
        event.preventDefault();
        $state.go(lastSubstate[toState.name], lastParams[toState.name]);
      }
    });

    $rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
      var deepStateStatus = computeDeepStateStatus(toState);
      if (deepStateStatus) {
        angular.forEach(lastSubstate, function (deepState, redirectState) {
          if (toState.name == deepState || toState.name.indexOf(redirectState + ".") != -1) {
            lastSubstate[redirectState] = toState.name;
            lastParams[redirectState] = angular.copy(toParams);
          }
        });
      }
    });
  });

  app.run(['$deepStateRedirect', function ($deepStateRedirect) {
    // Make sure $deepStateRedirect is instantiated
  }]);

//  return app;
//});

$StickyStateProvider.$inject = [ '$stateProvider' ];
function $StickyStateProvider($stateProvider) {
  // Holds all the states which are inactivated.  Inactivated states can be either sticky states, or descendants of sticky states.
  var inactiveStates = {}; // state.name -> (state)
  var stickyStates = {}; // state.name -> true
  var $state;

  // Called by $stateProvider.registerState();
  // registers a sticky state with $stickyStateProvider
  this.registerStickyState = function (state) {
    stickyStates[state.name] = state;
    // console.log("Registered sticky state: ", state);
  };
  
  this.enableDebug = function(enabled) {
    DEBUG = enabled;
  };

  this.$get = [ '$rootScope', '$state', '$injector', '$log', function ($rootScope, $state, $injector, $log) {
    // Each inactive states is either a sticky state, or a child of a sticky state.
    // This function finds the closest ancestor sticky state, then find that state's parent.
    // Map all inactive states to their closest parent-to-sticky state.
    function mapInactives() {
      var mappedStates = {};
      angular.forEach(inactiveStates, function(state, name) { 
        var stickyAncestors = getStickyStateStack(state);
        for (var i = 0; i < stickyAncestors.length; i++) {
          var parent = stickyAncestors[i].parent;
          mappedStates[parent.name] = mappedStates[parent.name] || [];
          mappedStates[parent.name].push(state);
        }
        if (mappedStates['']) {
          // This is necessary to compute Transition.inactives when there are sticky states are children to root state.
          mappedStates['__inactives'] = mappedStates[''];  // jshint ignore:line
        }
      });
      return mappedStates;
    }

    // Given a state, returns all ancestor states which are sticky.
    // Walks up the view's state's ancestry tree and locates each ancestor state which is marked as sticky.
    // Returns an array populated with only those ancestor sticky states.
    function getStickyStateStack(state) {
      var stack = [];
      if (!state) return stack;
      do {
        if (state.sticky) stack.push(state);
        state = state.parent;
      } while (state);
      stack.reverse();
      return stack;
    }

    // Used by processTransition to determine if what kind of sticky state transition this is.
    // returns { from: (bool), to: (bool) }
    function getStickyTransitionType(fromPath, toPath, keep) {
      if (fromPath[keep] === toPath[keep]) return { from: false, to: false };
      var stickyFromState = keep < fromPath.length && fromPath[keep].self.sticky;
      var stickyToState = keep < toPath.length && toPath[keep].self.sticky;
      return { from: stickyFromState, to: stickyToState };
    }

    // Returns a sticky transition type necessary to enter the state.
    // Transition can be: reactivate, updateStateParams, or enter

    // Note: if a state is being reactivated but params dont match, we treat
    // it as a Exit/Enter, thus the special "updateStateParams" transition.
    // If a parent inactivated state has "updateStateParams" transition type, then
    // all descendant states must also be exit/entered, thus the first line of this function.
    function getEnterTransition(state, stateParams, ancestorParamsChanged) {
      if (ancestorParamsChanged) return "updateStateParams";
      var inactiveState = inactiveStates[state.self.name];
      if (!inactiveState) return "enter";
//      if (inactiveState.locals == null || inactiveState.locals.globals == null) debugger;
      var paramsMatch = equalForKeys(stateParams, inactiveState.locals.globals.$stateParams, state.ownParams);
//      if (DEBUG) $log.debug("getEnterTransition: " + state.name + (paramsMatch ? ": reactivate" : ": updateStateParams"));
      return paramsMatch ? "reactivate" : "updateStateParams";
    }

    // Given a state and (optional) stateParams, returns the inactivated state from the inactive sticky state registry.
    function getInactivatedState(state, stateParams) {
      var inactiveState = inactiveStates[state.name];
      if (!inactiveState) return null;
      if (!stateParams) return inactiveState;
      var paramsMatch = equalForKeys(stateParams, inactiveState.locals.globals.$stateParams, state.ownParams);
      return paramsMatch ? inactiveState : null;
    }

    // Duplicates logic in $state.transitionTo, primarily to find the pivot state (i.e., the "keep" value)
    function equalForKeys(a, b, keys) {
      if (!keys) {
        keys = [];
        for (var n in a) keys.push(n); // Used instead of Object.keys() for IE8 compatibility
      }

      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (a[k] != b[k]) return false; // Not '===', values aren't necessarily normalized
      }
      return true;
    }

    var stickySupport = {
      getInactiveStates: function () {
        var states = [];
        angular.forEach(inactiveStates, function (state) {
          states.push(state);
        });
        return states;
      },
      getInactiveStatesByParent: function () {
        return mapInactives();
      },
      // Main API for $stickyState, used by $state.
      // Processes a potential transition, returns an object with the following attributes:
      // {
      //    inactives: Array of all states which will be inactive if the transition is completed. (both previously and newly inactivated)
      //    enter: Enter transition type for all added states.  This is a sticky array to "toStates" array in $state.transitionTo.
      //    exit: Exit transition type for all removed states.  This is a sticky array to "fromStates" array in $state.transitionTo.
      // }
      processTransition: function (transition) {
        // This object is returned
        var result = { inactives: [], enter: [], exit: [], keep: 0 };
        var fromPath = transition.fromState.path,
            fromParams = transition.fromParams,
            toPath = transition.toState.path,
            toParams = transition.toParams;
        var keep = 0, state = toPath[keep];

        while (state && state === fromPath[keep] && equalForKeys(toParams, fromParams, state.ownParams)) {
          state = toPath[++keep];
//          if (state != null && state.ownParams == null) debugger;
        }

        result.keep = keep;

        var idx, deepestUpdatedParams, deepestReactivate, reactivatedStatesByName = {}, pType = getStickyTransitionType(fromPath, toPath, keep);
        var ancestorUpdated = false; // When ancestor params change, treat reactivation as exit/enter

        // Calculate the "enter" transitions for new states in toPath
        // Enter transitions will be either "enter", "reactivate", or "updateStateParams" where
        //   enter: full resolve, no special logic
        //   reactivate: use previous locals
        //   updateStateParams: like 'enter', except exit the inactive state before entering it.
        for (idx = keep; idx < toPath.length; idx++) {
          var enterTrans = !pType.to ? "enter" : getEnterTransition(toPath[idx], transition.toParams, ancestorUpdated);
          ancestorUpdated = (ancestorUpdated || enterTrans == 'updateStateParams');
          result.enter[idx] = enterTrans;
          // If we're reactivating a state, make a note of it, so we can remove that state from the "inactive" list
          if (enterTrans == 'reactivate')
            deepestReactivate = reactivatedStatesByName[toPath[idx].name] = toPath[idx];
          if (enterTrans == 'updateStateParams')
            deepestUpdatedParams = toPath[idx];
        }
        deepestReactivate = deepestReactivate ? deepestReactivate.self.name + "." : "";
        deepestUpdatedParams = deepestUpdatedParams ? deepestUpdatedParams.self.name + "." : "";

        // Inactive states, before the transition is processed, mapped to the parent to the sticky state.
        var inactivesByParent = mapInactives();

        // Locate currently and newly inactive states (at pivot and above) and store them in the output array 'inactives'.
        for (idx = 0; idx < keep; idx++) {
          var inactiveChildren = inactivesByParent[fromPath[idx].self.name];
          for (var i = 0; inactiveChildren && i < inactiveChildren.length; i++) {
            var child = inactiveChildren[i];
            // Don't organize state as inactive if we're about to reactivate it.
            if (!reactivatedStatesByName[child.name] &&
                (!deepestReactivate || (child.self.name.indexOf(deepestReactivate) !== 0)) &&
                (!deepestUpdatedParams || (child.self.name.indexOf(deepestUpdatedParams) !== 0)))
              result.inactives.push(child);
          }
        }

        // Calculate the "exit" transition for states not kept, in fromPath.
        // Exit transition can be one of:
        //   exit: standard state exit logic
        //   inactivate: register state as an inactive state
        for (idx = keep; idx < fromPath.length; idx++) {
          var exitTrans = "exit";
          if (pType.from) {
            // State is being inactivated, note this in result.inactives array
            result.inactives.push(fromPath[idx]);
            exitTrans = "inactivate";
          }
          result.exit[idx] = exitTrans;
        }

//      $log.debug("processTransition: " , result);
        return result;
      },

      // Adds a state to the inactivated sticky state registry.
      stateInactivated: function (state) {
        // Keep locals around.
        inactiveStates[state.self.name] = state;
        // Notify states they are being Inactivated (i.e., a different
        // sticky state tree is now active).
        state.self.status = 'inactive';
        if (state.self.onInactivate)
          $injector.invoke(state.self.onInactivate, state.self, state.locals.globals);
      },

      // Removes a previously inactivated state from the inactive sticky state registry
      stateReactivated: function (state) {
        if (inactiveStates[state.self.name]) {
          delete inactiveStates[state.self.name];
        }
        state.self.status = 'entered';
//        if (state.locals == null || state.locals.globals == null) debugger;
        if (state.self.onReactivate)
          $injector.invoke(state.self.onReactivate, state.self, state.locals.globals);
      },

      // Exits all inactivated descendant substates when the ancestor state is exited.
      // When transitionTo is exiting a state, this function is called with the state being exited.  It checks the
      // registry of inactivated states for descendants of the exited state and also exits those descendants.  It then
      // removes the locals and de-registers the state from the inactivated registry.
      stateExiting: function (exiting, exitQueue, onExit) {
        var substatePrefix = exiting.self.name + "."; // All descendant states will start with this prefix
        var exitingNames = {};
        angular.forEach(exitQueue, function (state) {
          exitingNames[state.self.name] = true;
        });
        
        angular.forEach(inactiveStates, function(inactiveExiting, name) {
          // TODO: Might need to run the inactivations in the proper depth-first order?
          if (!exitingNames[name] && name.indexOf(substatePrefix) === 0) { // inactivated state's name starts with the prefix.
            if (DEBUG) $log.debug("Exiting " + name + " because it's a substate of " + substatePrefix + " and wasn't found in ", exitingNames);
            if (inactiveExiting.self.onExit)
              $injector.invoke(inactiveExiting.self.onExit, inactiveExiting.self, inactiveExiting.locals.globals);
            inactiveExiting.locals = null;
            inactiveExiting.self.status = 'exited';
            delete inactiveStates[name];
          }
        });
        
        if (onExit)
          $injector.invoke(onExit, exiting.self, exiting.locals.globals);
        exiting.locals = null;
        exiting.self.status = 'exited';
        delete inactiveStates[exiting.self.name];
      },

      // Removes a previously inactivated state from the inactive sticky state registry
      stateEntering: function (entering, params, onEnter) {
        var inactivatedState = getInactivatedState(entering);
        if (inactivatedState && !getInactivatedState(entering, params)) {
          var savedLocals = entering.locals;
          this.stateExiting(inactivatedState);
          entering.locals = savedLocals;
        }
        entering.self.status = 'entered';

        if (onEnter)
          $injector.invoke(onEnter, entering.self, entering.locals.globals);
      }
    };

    return stickySupport;
  }];
}

angular.module("ct.ui.router.extras").provider("$stickyState", $StickyStateProvider);

var _StickyState; // internal reference to $stickyStateProvider
var internalStates = {}; // Map { statename -> InternalStateObj } holds internal representation of all states
var root, // Root state, internal representation
    pendingTransitions = [], // One transition may supersede another.  This holds references to all pending transitions
    pendingRestore, // The restore function from the superseded transition
    inactivePseudoState; // This pseudo state holds all the inactive states' locals (resolved state data, such as views etc)

// Creates a blank surrogate state
function SurrogateState(type) {
  return {
    resolve: { },
    locals: {
      globals: root && root.locals && root.locals.globals
    },
    views: { },
    self: { },
    params: { },
    ownParams: [],
    surrogateType: type
  };
}


// Grab a copy of the $stickyState service for use by the transition management code
angular.module("ct.ui.router.extras").run(["$stickyState", function ($stickyState) { _StickyState = $stickyState; }]);

angular.module("ct.ui.router.extras").config(
    [ "$provide", "$stateProvider", '$stickyStateProvider',
      function ($provide, $stateProvider, $stickyStateProvider) {
        // inactivePseudoState (__inactives) holds all the inactive locals (resolved states data: views, etc)
        // 
        // __inactives needs to reference root.locals.globals.  At this time, root.locals.globals isn't populated
        // so copy a reference to root.locals onto __inactives.locals (then when ui-router populates root.locals.globals
        // it also populates __inactives.locals.globals.  Likewise, this means inactive states are stored on the 
        // root state's locals, hmmm that might not be great.
        var pState = { 
          self: {  name: '__inactives'  },
          onEnter: function() { inactivePseudoState.locals.globals = root.locals.globals; }
        };
        inactivePseudoState = angular.extend(new SurrogateState("__inactives"), pState);
        
        // Need access to the internal 'root' state object.  Get it by decorating the StateBuilder parent function.  
        $stateProvider.decorator('parent', function (state, parentFn) {
          if (!root) {
            // Note: this code gets run only on the first state
            root = parentFn({}); // StateBuilder.parent({}) returns the root internal state object
            inactivePseudoState.parent = root; // Hook pseudoState.parent up to the root state
            inactivePseudoState.locals = root.locals; 
          }
          return parentFn(state);
        });

        // Sticky States retains views by holding onto the inactivated locals of states.  It stores 
        // them in a pseudo state called __inactives which is inserted between root and each top level state.
        $stateProvider.decorator('path', function (state, parentFn) {
          // Decorate the path of each state, adding the __inactives pseudostate to the beginning.
          
          // Note to self: I think this could be simplified by adding __inactives to the root state in the 'parent' 
          // decorator.  Then, stock UI-Router code will build the substate path with __inactives as pre-root.
          
          // Capture each internal state representations
          internalStates[state.self.name] = state;
          state.self.$$state = function() { return internalStates[state.self.name]; };
          
          // Register the ones marked as "sticky"
          if (state.self.sticky === true) {
            $stickyStateProvider.registerStickyState(state.self);
          }
          // Add a fake parent node to each state's path to hold all the inactive states' locals
          var realPath = [], temp = parentFn(state); // call parent path function, which returns an array of states
          angular.forEach(temp, function (pathElem) {
            // paths are constructed from the parent paths
            if (pathElem !== inactivePseudoState) {
              realPath.push(pathElem);
            }
          });
          // Return a fake path with the first element being the inactivePseudState
          return [ inactivePseudoState ].concat(realPath);
        });

        $provide.decorator("$state", ['$delegate', '$log', function ($state, $log) {
          var realTransitionTo = $state.transitionTo;
          $state.transitionTo = function (to, toParams, options) {
            var idx = pendingTransitions.length;
            if (pendingRestore) {
              pendingRestore();
              if (DEBUG) { $log.debug("Restored paths from pending transition"); }
            }

            // Custom transitionTo logic here
            var fromState = $state.$current, fromParams = $state.params;
            var rel = options.relative || $state.$current; // Not sure if/when $state.$current is appropriate here.
            var toStateSelf = $state.get(to, rel); // exposes findState relative path functionality, returns state.self
            var savedToStatePath, savedFromStatePath, stickyTransitions;
            var reactivated = [], exited = [], terminalReactivatedState;

            function debugTransition(currentTransition, stickyTransition) {
              function message(path, index, state) {
                return (path[index] ? path[index].toUpperCase() + ": " + state.self.name : "(" + state.self.name + ")");
              }

              var inactiveLogVar = map(stickyTransition.inactives, function (state) {
                return state.self.name;
              });
              var enterLogVar = map(toState.path, function (state, index) {
                return message(stickyTransition.enter, index, state);
              });
              var exitLogVar = map(fromState.path, function (state, index) {
                return message(stickyTransition.exit, index, state);
              });
              
              var transitionMessage = currentTransition.fromState.self.name + ": " +
                  angular.toJson(currentTransition.fromParams) + ": " +
                  " -> " +
                  currentTransition.toState.self.name + ": " +
                  angular.toJson(currentTransition.toParams);
              
              $log.debug("   Current transition: ", transitionMessage);
              $log.debug("Before transition, inactives are:   : ", map(_StickyState.getInactiveStates(), function(s) { return s.self.name; } ));
              $log.debug("After transition,  inactives will be: ", inactiveLogVar);
              $log.debug("Transition will exit:  ", exitLogVar);
              $log.debug("Transition will enter: ", enterLogVar);
            }

            var noop = function () { };
            var restore = function () {
              if (savedToStatePath) {
                toState.path = savedToStatePath;
                savedToStatePath = null;
              }

              if (savedFromStatePath) {
                fromState.path = savedFromStatePath;
                savedFromStatePath = null;
              }

              angular.forEach(restore.restoreFunctions, function (restoreFunction) {
                restoreFunction();
              });
              restore = noop;
              pendingRestore = null;
              pendingTransitions.splice(idx, 1); // Remove this transition from the list
            };
            restore.restoreFunctions = [];
            restore.addRestoreFunction = function addRestoreFunction(fn) {
              this.restoreFunctions.push(fn);
            };

            function stateReactivatedSurrogatePhase1(state) {
              var surrogate = angular.extend(new SurrogateState("reactivate_p1"), { locals: state.locals });
              surrogate.self = angular.extend({}, state.self);
              return surrogate;
            }

            function stateReactivatedSurrogatePhase2(state) {
              var surrogate = angular.extend(new SurrogateState("reactivate_p2"), state);
//              surrogate.self = angular.extend({}, state.self);
              var oldOnEnter = surrogate.self.onEnter;
              surrogate.self.onEnter = function () {
                // ui-router sets locals on the surrogate to a blank locals (because we gave it nothing to resolve)
                // Re-set it back to the already loaded state.locals here.
                surrogate.locals = state.locals;
                _StickyState.stateReactivated(state);
              };
              restore.addRestoreFunction(function() {
                state.self.onEnter = oldOnEnter;
              });
              return surrogate;
            }

            function stateInactivatedSurrogate(state) {
              var surrogate = new SurrogateState("inactivate");
              surrogate.self = state.self;
              var oldOnExit = state.self.onExit;
              surrogate.self.onExit = function () {
                _StickyState.stateInactivated(state);
              };
              restore.addRestoreFunction(function() {
                state.self.onExit = oldOnExit;
              });
              return surrogate;
            }

            function stateEnteredSurrogate(state, toParams) {
              var oldOnEnter = state.self.onEnter;
              state.self.onEnter = function () {
                _StickyState.stateEntering(state, toParams, oldOnEnter);
              };
              restore.addRestoreFunction(function () {
                state.self.onEnter = oldOnEnter;
              });

              return state;
            }

            function stateExitedSurrogate(state) {
              var oldOnExit = state.self.onExit;
//              state.self = angular.extend({}, state.self);
              state.self.onExit = function () {
                _StickyState.stateExiting(state, exited, oldOnExit);
              };
              restore.addRestoreFunction(function () {
                state.self.onExit = oldOnExit;
              });

              return state;
            }

            // if (!toStateSelf) defugger;
            if (toStateSelf) {
              var toState = internalStates[toStateSelf.name]; // have the state, now grab the internal state representation
//              if (!toState) debugger;
              if (toState) {
                savedToStatePath = toState.path;
                savedFromStatePath = fromState.path;

                var currentTransition = {toState: toState, toParams: toParams || {}, fromState: fromState, fromParams: fromParams || {}};
//                console.log("Current transition: ", msg);

                pendingTransitions.push(currentTransition);
                pendingRestore = restore;
                stickyTransitions = _StickyState.processTransition(currentTransition);
                if (DEBUG) debugTransition(currentTransition, stickyTransitions);

                var surrogateToPath = toState.path.slice(0, stickyTransitions.keep);
                var surrogateFromPath = fromState.path.slice(0, stickyTransitions.keep);

                // Rebuild root.inactiveLocals each time...
                angular.forEach(inactivePseudoState.locals, function(local, name) {
                  delete inactivePseudoState.locals[name];
                });
                
                for (var i = 0; i < stickyTransitions.inactives.length; i++) {
                  var iLocals = stickyTransitions.inactives[i].locals;
                  angular.forEach(iLocals, function(view, name) {
                    if (iLocals.hasOwnProperty(name) && name.indexOf("@") != -1) {
                      inactivePseudoState.locals[name] = view; // Add all inactive views not already included.
                    }
                  });
                }

                angular.forEach(stickyTransitions.enter, function (value, idx) {
                  var surrogate;
                  if (value === "reactivate") {
                    surrogate = stateReactivatedSurrogatePhase1(toState.path[idx]);
                    // Add surrogate to ToPath again and FromPath.
                    // This is to get ui-router to add the surrogate locals to the protoypal locals object
                    surrogateToPath.push(surrogate);
                    surrogateFromPath.push(surrogate);  // so toPath[i] === fromPath[i]
                    reactivated.push(stateReactivatedSurrogatePhase2(toState.path[idx]));
                    terminalReactivatedState = surrogate;
                  } else if (value === "updateStateParams") {
                    surrogate = stateEnteredSurrogate(toState.path[idx]);
                    surrogateToPath.push(surrogate);
                    terminalReactivatedState = surrogate;
                  } else if (value === "enter") {
                    surrogateToPath.push(stateEnteredSurrogate(toState.path[idx]));
                  }
                });

                angular.forEach(stickyTransitions.exit, function (value, idx) {
                  var exiting = fromState.path[idx];
                  if (value === "inactivate") {
                    surrogateFromPath.push(stateInactivatedSurrogate(exiting));
                    exited.push(exiting);
                  } else if (value === "exit") {
                    surrogateFromPath.push(stateExitedSurrogate(exiting));
                    exited.push(exiting);
                  }
                });

                if (reactivated.length) {
                  angular.forEach(reactivated, function (surrogate) {
                    // Add surrogate for reactivated to ToPath again, this time without a matching FromPath entry
                    // This is to get ui-router to call the surrogate's onEnter callback.
                    surrogateToPath.push(surrogate);
                  });
                }

                if (terminalReactivatedState) {
                  var prefix = terminalReactivatedState.self.name + ".";
                  var inactiveStates = _StickyState.getInactiveStates();
                  var inactiveOrphans = [];
                  inactiveStates.forEach(function (exiting) {
                    if (exiting.self.name.indexOf(prefix) === 0) {
//                      $log.debug("exitable: ", exiting.self.name);
                      inactiveOrphans.push(exiting);
                    }
                  });
                  inactiveOrphans.sort();
                  inactiveOrphans.reverse();
                  surrogateFromPath = surrogateFromPath.concat(map(inactiveOrphans, function (exiting) {
                    return stateExitedSurrogate(exiting);
                  }));
                  exited = exited.concat(inactiveOrphans);
                }

                toState.path = surrogateToPath;
                fromState.path = surrogateFromPath;

                var pathMessage = function (state) {
                  return (state.surrogateType ? state.surrogateType + ":" : "") + state.self.name;
                };
                
                if (DEBUG) $log.debug("SurrogateFromPath: ", map(surrogateFromPath, pathMessage));
                if (DEBUG) $log.debug("SurrogateToPath:   ", map(surrogateToPath, pathMessage));
              }
            }

            var transitionPromise = realTransitionTo.apply($state, arguments);
            transitionPromise.then(function transitionSuccess(state) {
              restore();
              state.status = 'active';
              if (DEBUG) {
                var currentState = internalStates[state.name];
                $log.debug("Current state: " + currentState.self.name + ", inactive states: ", map(_StickyState.getInactiveStates(), function (s) {
                  return s.self.name;
                }));
                
                var viewMsg = function(local, name) {
                  return "'" + name + "' (" + local.$$state.name + ")";
                };
                var statesOnly = function(local, name) {
                  return name != 'globals' && name != 'resolve';
                };
                var viewsForState = function(state) {
                  var views = map(filterObj(state.locals, statesOnly), viewMsg).join(", ");
                  return "(" + (state.self.name ? state.self.name : "root") + ".locals" + (views.length ? ": " + views : "") + ")"; 
                };
                
                var message = viewsForState(currentState);
                var parent = currentState.parent;
                while (parent && parent !== currentState) {
                  if (parent.self.name === "") {
                    // Show the __inactives before showing root state.
                    message = viewsForState($state.$current.path[0]) + " / " + message;
                  }
                  message = viewsForState(parent) + " / " + message;
                  currentState = parent;
                  parent = currentState.parent;
                }
                
                $log.debug("Views: " + message);
              }
            }, function transitionFailed(err) {
              if (err.message !== "transition prevented" && 
                  err.message !== "transition aborted" && 
                  err.message !== "transition superseded") {
                if (DEBUG) $log.debug("transition failed", err);
                if (DEBUG) console.log(err.stack);
              }
              restore();
            });
          };
          return $state;
        }]);
      }]);




//define(['angularAMD'], function (angularAMD) {
  angular.module('ct.ui.router.extras').provider('$futureState', function _futureStateProvider($stateProvider, $urlRouterProvider) {
    var stateFactories = {}, futureStates = {}, futureUrlPrefixes = {};
    var transitionPending = false, resolveFunctions = [], initPromise, initDone = false;
    var provider = this;

    // This function registers a promiseFn, to be resolved before the url/state matching code
    // will reject a route.  The promiseFn is injected/executed using the runtime $injector.
    // The function should return a promise.  
    // When all registered promises are resolved, then the route is re-sync'ed.
    
    // Example: function($http) {
    //  return $http.get('//server.com/api/DynamicFutureStates').then(function(data) {
    //    angular.forEach(data.futureStates, function(fstate) { $futureStateProvider.futureState(fstate); });
    //  };
    // }
    this.addResolve = function (promiseFn) {
      resolveFunctions.push(promiseFn);
    };

    // Register a state factory function for a particular future-state type.  This factory, given a future-state object,
    // should create a ui-router state.
    // The factory function is injected/executed using the runtime $injector.  The future-state is injected as 'futureState'.
    
    // Example: 
    //    $futureStateProvider.stateFactory('test', function(futureState) {
    //      return {
    //        name: futureState.stateName,
    //        url: futureState.urlFragment,
    //        template: '<h3>Future State Template</h3>',
    //        controller: function() {
    //          console.log("Entered state " + futureState.stateName);
    //        }
    //      }
    //    });
    this.stateFactory = function (futureStateType, factory) {
      stateFactories[futureStateType] = factory;
    };

    this.futureState = function (futureState) {
      futureStates[futureState.stateName] = futureState;
      futureUrlPrefixes[futureState.urlPrefix] = futureState;
    };
    
    this.get = function() {
      return angular.extend({}, futureStates);
    };
    
    /* options is an object with at least a name or url attribute */
    function findFutureState($state, options) {
      if (options.name) {
        var nameComponents = options.name.split(/\./);
        while (nameComponents.length) {
          var stateName = nameComponents.join(".");
          if ($state.get(stateName))
            return null; // State is already defined; nothing to do
          if (futureStates[stateName])
            return futureStates[stateName];
          nameComponents.pop();
        }
      }

      if (options.url) {
        var urlComponents = options.url.split(/\//);
        while (urlComponents.length) {
          var urlPrefix = urlComponents.join("/");
          if (futureUrlPrefixes[urlPrefix])
            return futureUrlPrefixes[urlPrefix];
          urlComponents.pop();
        }
      }
    }

    function lazyLoadState($injector, futureState) {
      if (!futureState) {
        var deferred = $q.defer();
        deferred.reject("No lazyState passed in " + futureState);
        return deferred.promise;
      }

      var type = futureState.type;
      var factory = stateFactories[type];
      if (!factory) throw Error("No state factory for futureState.type: " + (futureState && futureState.type));
      return $injector.invoke(factory, factory, { futureState: futureState });
    }

    function futureState_otherwise($injector, $location) {
      var resyncing = false;
      var $log = $injector.get("$log");

      var otherwiseFunc = function otherwiseFunc($state) {
        $log.debug("Unable to map " + $location.path());
        $location.url("/");
      };

      var lazyLoadMissingState = function lazyLoadMissingState($rootScope, $urlRouter, $state) {
        if (!initDone) {
          // Asynchronously load state definitions, then resync URL
          initPromise().then(function initialResync() {
            resyncing = true;
            $urlRouter.sync();
            resyncing = false;
          });
          initDone = true;
          return;
        }

        
        var futureState = findFutureState($state, { url: $location.path() });
        if (!futureState) {
          return $injector.invoke(otherwiseFunc);
        }

        transitionPending = true;
        // Config loaded.  Asynchronously lazy-load state definition from URL fragment, if mapped.
        lazyLoadState($injector, futureState).then(function lazyLoadedStateCallback(state) {
          // TODO: Should have a specific resolve value that says 'dont register a state because I already did'
          if (state && !$state.get(state))
            $stateProvider.state(state);
          resyncing = true;
          $urlRouter.sync();
          resyncing = false;
          transitionPending = false;
        }, function lazyLoadStateAborted() {
          transitionPending = false;
          $state.go("top");
        });
      };
      if (transitionPending) return;

      var nextFn = resyncing ? otherwiseFunc : lazyLoadMissingState;
      return $injector.invoke(nextFn);
    }
    $urlRouterProvider.otherwise(futureState_otherwise);

    var serviceObject = {
      getResolvePromise: function () {
        return initPromise();
      }
    };
    
    // Used in .run() block to init
    this.$get = function futureStateProvider_get($injector, $state, $q, $rootScope, $urlRouter, $log) {
      function init() {
        $rootScope.$on("$stateNotFound", function futureState_notFound(event, unfoundState, fromState, fromParams) {
          if (transitionPending) return;
          $log.debug("event, unfoundState, fromState, fromParams", event, unfoundState, fromState, fromParams);

          var futureState = findFutureState($state, { name: unfoundState.to });
          if (!futureState) return;

          event.preventDefault();
          transitionPending = true;

          var promise = lazyLoadState($injector, futureState);
          promise.then(function (state) {
            // TODO: Should have a specific resolve value that says 'dont register a state because I already did'
            if (state)
              $stateProvider.state(state);
            $state.go(unfoundState.to, unfoundState.toParams);
            transitionPending = false;
          }, function (error) {
            console.log("failed to lazy load state ", error);
            $state.go(fromState, fromParams);
            transitionPending = false;
          });
        });

        // Do this better.  Want to load remote config once, before everything else
        if (!initPromise) {
          var promises = [];
          angular.forEach(resolveFunctions, function(promiseFn) {
            promises.push($injector.invoke(promiseFn));
          });
          initPromise = function() { return $q.all(promises); };
//          initPromise = _.once(function flattenFutureStates() {
//            var allPromises = $q.all(promises);
//            return allPromises.then(function(data) { 
//              return _.flatten(data); 
//            });
//          });
        }

        // TODO: analyze this. I'm calling $urlRouter.sync() in two places for retry-initial-transition.
        // TODO: I should only need to do this once.  Pick the better place and remove the extra resync.
        initPromise().then(function retryInitialState() {
          $urlRouter.sync();
        });
      }
      init();

      serviceObject.state = $stateProvider.state;
      serviceObject.futureState = provider.futureState;
      serviceObject.get = provider.get;
      
      return serviceObject;
    };
  });

  angular.module('ct.ui.router.extras').run(['$futureState', 
      // Just inject $futureState so it gets initialized.
    function ($futureState) { }
  ]);

//  return app;
//});

angular.module('ct.ui.router.extras').service("$previousState", 
    [ '$rootScope', '$state', 
function($rootScope, $state) {
  var previous = null;
  var memos = {};

  var lastPrevious = null;

  $rootScope.$on("$stateChangeStart", function(evt, toState, toStateParams, fromState, fromStateParams) {
    // State change is starting.  Keep track of the CURRENT previous state in case we have to restore it
    lastPrevious = previous;
    previous = { state: fromState, params: fromStateParams };
  });

  $rootScope.$on("$stateChangeError", function() {
    // State change did not occur due to an error.  Restore the previous previous state.
    previous = lastPrevious;
    lastPrevious = null;
  });

  $rootScope.$on("$stateChangeSuccess", function() {
    lastPrevious = null;
  });

  var $previousState = {
    get: function(memoName) {
      return memoName ? memos[memoName] : previous; 
    },
    go: function(memoName) {
      var to = $previousState.get(memoName);
      return $state.go(to.state, to.params);
    },
    memo: function(memoName) {
      memos[memoName] = previous; 
    },
    forget: function(memoName) {
      delete memos[memoName];
    }
  };

  return $previousState;
}]);

angular.module('ct.ui.router.extras').run(['$previousState', function($previousState) {
  // Inject $previousState so it can register $rootScope events
}]);

}(window));