(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Alt = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var globalSymbolRegistryList = {};

// Aliases & Helpers
var make = Object.create;
var defProps = Object.defineProperties;
var defProp = Object.defineProperty;
var defValue = function (value) {
  var opts = arguments[1] === undefined ? {} : arguments[1];
  return {
    value: value,
    configurable: !!opts.c,
    writable: !!opts.w,
    enumerable: !!opts.e
  };
};
var isSymbol = function (symbol) {
  return symbol && symbol[xSymbol.toStringTag] === "Symbol";
};

var supportsAccessors = undefined;
try {
  var x = defProp({}, "y", { get: function () {
      return 1;
    } });
  supportsAccessors = x.y === 1;
} catch (e) {
  supportsAccessors = false;
}

var id = {};
var uid = function (desc) {
  desc = String(desc);
  var x = "";
  var i = 0;
  while (id[desc + x]) {
    x = i += 1;
  }
  id[desc + x] = 1;

  var tag = "Symbol(" + desc + "" + x + ")";

  /* istanbul ignore else */
  if (supportsAccessors) {
    // Make the symbols hidden to pre-es6 code
    defProp(Object.prototype, tag, {
      get: undefined,
      set: function (value) {
        defProp(this, tag, defValue(value, { c: true, w: true }));
      },
      configurable: true,
      enumerable: false
    });
  }

  return tag;
};

// The base symbol
var SymbolProto = make(null);

// 19.4.1.1
function xSymbol(descString) {
  if (this instanceof xSymbol) {
    throw new TypeError("Symbol is not a constructor");
  }

  descString = descString === undefined ? "" : String(descString);

  var tag = uid(descString);

  /* istanbul ignore next */
  if (!supportsAccessors) {
    return tag;
  }

  return make(SymbolProto, {
    __description__: defValue(descString),
    __tag__: defValue(tag)
  });
}

defProps(xSymbol, {
  // 19.4.2.1
  "for": defValue(function (key) {
    var stringKey = String(key);

    if (globalSymbolRegistryList[stringKey]) {
      return globalSymbolRegistryList[stringKey];
    }

    var symbol = xSymbol(stringKey);
    globalSymbolRegistryList[stringKey] = symbol;

    return symbol;
  }),

  // 19.4.2.5
  keyFor: defValue(function (sym) {
    if (!isSymbol(sym)) {
      throw new TypeError("" + sym + " is not a symbol");
    }

    for (var key in globalSymbolRegistryList) {
      if (globalSymbolRegistryList[key] === sym) {
        return globalSymbolRegistryList[key].__description__;
      }
    }
  })
});

// 6.1.5.1
defProps(xSymbol, {
  hasInstance: defValue(xSymbol("hasInstance")),
  isConcatSpreadable: defValue(xSymbol("isConcatSpreadable")),
  iterator: defValue(xSymbol("iterator")),
  match: defValue(xSymbol("match")),
  replace: defValue(xSymbol("replace")),
  search: defValue(xSymbol("search")),
  species: defValue(xSymbol("species")),
  split: defValue(xSymbol("split")),
  toPrimitive: defValue(xSymbol("toPrimitive")),
  toStringTag: defValue(xSymbol("toStringTag")),
  unscopables: defValue(xSymbol("unscopables"))
});

// 19.4.3
defProps(SymbolProto, {
  constructor: defValue(xSymbol),

  // 19.4.3.2
  toString: defValue(function () {
    return this.__tag__;
  }),

  // 19.4.3.3
  valueOf: defValue(function () {
    return "Symbol(" + this.__description__ + ")";
  })
});

// 19.4.3.5
/* istanbul ignore else */
if (supportsAccessors) {
  defProp(SymbolProto, xSymbol.toStringTag, defValue("Symbol", { c: true }));
}

module.exports = typeof Symbol === "function" ? Symbol : xSymbol;


},{}],2:[function(require,module,exports){
'use strict';

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  if (!this._events || !this._events[event]) return [];
  if (this._events[event].fn) return [this._events[event].fn];

  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
    ee[i] = this._events[event][i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  if (fn) {
    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
      events.push(listeners);
    }
    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
        events.push(listeners[i]);
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[event] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[event];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[event];
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the module.
//
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.EventEmitter2 = EventEmitter;
EventEmitter.EventEmitter3 = EventEmitter;

//
// Expose the module.
//
module.exports = EventEmitter;

},{}],3:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher')

},{"./lib/Dispatcher":4}],4:[function(require,module,exports){
/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

"use strict";

var invariant = require('./invariant');

var _lastID = 1;
var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *
 *         case 'city-update':
 *           FlightPriceStore.price =
 *             FlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

  function Dispatcher() {
    this.$Dispatcher_callbacks = {};
    this.$Dispatcher_isPending = {};
    this.$Dispatcher_isHandled = {};
    this.$Dispatcher_isDispatching = false;
    this.$Dispatcher_pendingPayload = null;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   *
   * @param {function} callback
   * @return {string}
   */
  Dispatcher.prototype.register=function(callback) {
    var id = _prefix + _lastID++;
    this.$Dispatcher_callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   *
   * @param {string} id
   */
  Dispatcher.prototype.unregister=function(id) {
    invariant(
      this.$Dispatcher_callbacks[id],
      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
      id
    );
    delete this.$Dispatcher_callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   *
   * @param {array<string>} ids
   */
  Dispatcher.prototype.waitFor=function(ids) {
    invariant(
      this.$Dispatcher_isDispatching,
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    );
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this.$Dispatcher_isPending[id]) {
        invariant(
          this.$Dispatcher_isHandled[id],
          'Dispatcher.waitFor(...): Circular dependency detected while ' +
          'waiting for `%s`.',
          id
        );
        continue;
      }
      invariant(
        this.$Dispatcher_callbacks[id],
        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
        id
      );
      this.$Dispatcher_invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   *
   * @param {object} payload
   */
  Dispatcher.prototype.dispatch=function(payload) {
    invariant(
      !this.$Dispatcher_isDispatching,
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    );
    this.$Dispatcher_startDispatching(payload);
    try {
      for (var id in this.$Dispatcher_callbacks) {
        if (this.$Dispatcher_isPending[id]) {
          continue;
        }
        this.$Dispatcher_invokeCallback(id);
      }
    } finally {
      this.$Dispatcher_stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   *
   * @return {boolean}
   */
  Dispatcher.prototype.isDispatching=function() {
    return this.$Dispatcher_isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @param {string} id
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_invokeCallback=function(id) {
    this.$Dispatcher_isPending[id] = true;
    this.$Dispatcher_callbacks[id](this.$Dispatcher_pendingPayload);
    this.$Dispatcher_isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @param {object} payload
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_startDispatching=function(payload) {
    for (var id in this.$Dispatcher_callbacks) {
      this.$Dispatcher_isPending[id] = false;
      this.$Dispatcher_isHandled[id] = false;
    }
    this.$Dispatcher_pendingPayload = payload;
    this.$Dispatcher_isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_stopDispatching=function() {
    this.$Dispatcher_pendingPayload = null;
    this.$Dispatcher_isDispatching = false;
  };


module.exports = Dispatcher;

},{"./invariant":5}],5:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (false) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}],6:[function(require,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}],7:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _import = require('./symbols/symbols');

var Sym = _interopRequireWildcard(_import);

var ACTION_HANDLER = Sym.ACTION_HANDLER;
var ACTION_UID = Sym.ACTION_UID;

var AltAction = (function () {
  function AltAction(alt, name, action, actions) {
    _classCallCheck(this, AltAction);

    this[ACTION_UID] = name;
    this[ACTION_HANDLER] = action.bind(this);
    this.actions = actions;
    this.alt = alt;
  }

  _createClass(AltAction, [{
    key: 'dispatch',
    value: function dispatch(data) {
      this.alt.dispatch(this[ACTION_UID], data);
    }
  }]);

  return AltAction;
})();

exports['default'] = AltAction;
module.exports = exports['default'];

},{"./symbols/symbols":9}],8:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _EventEmitter = require('eventemitter3');

var _EventEmitter2 = _interopRequireWildcard(_EventEmitter);

var _assign = require('object-assign');

var _assign2 = _interopRequireWildcard(_assign);

var _Symbol = require('es-symbol');

var _Symbol2 = _interopRequireWildcard(_Symbol);

var _import = require('./symbols/symbols');

var Sym = _interopRequireWildcard(_import);

var ALL_LISTENERS = Sym.ALL_LISTENERS;
var LIFECYCLE = Sym.LIFECYCLE;
var LISTENERS = Sym.LISTENERS;
var PUBLIC_METHODS = Sym.PUBLIC_METHODS;
var STATE_CONTAINER = Sym.STATE_CONTAINER;

// event emitter instance
var EE = _Symbol2['default']();

var AltStore = (function () {
  function AltStore(alt, model, state, StoreModel) {
    var _this = this;

    _classCallCheck(this, AltStore);

    this[EE] = new _EventEmitter2['default']();
    this[LIFECYCLE] = {};
    this[STATE_CONTAINER] = state || model;

    this._storeName = model._storeName;
    this.boundListeners = model[ALL_LISTENERS];
    this.StoreModel = StoreModel;
    if (typeof this.StoreModel === 'object') {
      this.StoreModel.state = _assign2['default']({}, StoreModel.state);
    }

    _assign2['default'](this[LIFECYCLE], model[LIFECYCLE]);
    _assign2['default'](this, model[PUBLIC_METHODS]);

    // Register dispatcher
    this.dispatchToken = alt.dispatcher.register(function (payload) {
      if (model[LIFECYCLE].beforeEach) {
        model[LIFECYCLE].beforeEach(payload, _this[STATE_CONTAINER]);
      }

      if (model[LISTENERS][payload.action]) {
        var result = false;

        try {
          result = model[LISTENERS][payload.action](payload.data);
        } catch (e) {
          if (_this[LIFECYCLE].error) {
            _this[LIFECYCLE].error(e, payload, _this[STATE_CONTAINER]);
          } else {
            throw e;
          }
        }

        if (result !== false) {
          _this.emitChange();
        }
      }

      if (model[LIFECYCLE].afterEach) {
        model[LIFECYCLE].afterEach(payload, _this[STATE_CONTAINER]);
      }
    });

    if (this[LIFECYCLE].init) {
      this[LIFECYCLE].init();
    }
  }

  _createClass(AltStore, [{
    key: 'getEventEmitter',
    value: function getEventEmitter() {
      return this[EE];
    }
  }, {
    key: 'emitChange',
    value: function emitChange() {
      this[EE].emit('change', this[STATE_CONTAINER]);
    }
  }, {
    key: 'listen',
    value: function listen(cb) {
      var _this2 = this;

      this[EE].on('change', cb);
      return function () {
        return _this2.unlisten(cb);
      };
    }
  }, {
    key: 'unlisten',
    value: function unlisten(cb) {
      if (this[LIFECYCLE].unlisten) {
        this[LIFECYCLE].unlisten();
      }
      this[EE].removeListener('change', cb);
    }
  }, {
    key: 'getState',
    value: function getState() {
      return this.StoreModel.config.getState.call(this, this[STATE_CONTAINER]);
    }
  }]);

  return AltStore;
})();

exports['default'] = AltStore;
module.exports = exports['default'];

},{"./symbols/symbols":9,"es-symbol":1,"eventemitter3":2,"object-assign":6}],9:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Symbol = require('es-symbol');

var _Symbol2 = _interopRequireWildcard(_Symbol);

// action creator handler
var ACTION_HANDLER = _Symbol2['default']();

exports.ACTION_HANDLER = ACTION_HANDLER;
// the action's uid symbol for listening
var ACTION_KEY = _Symbol2['default']();

exports.ACTION_KEY = ACTION_KEY;
// per instance registry of actions
var ACTIONS_REGISTRY = _Symbol2['default']();

exports.ACTIONS_REGISTRY = ACTIONS_REGISTRY;
// the action's name
var ACTION_UID = _Symbol2['default']();

exports.ACTION_UID = ACTION_UID;
// store all of a store's listeners
var ALL_LISTENERS = _Symbol2['default']();

exports.ALL_LISTENERS = ALL_LISTENERS;
// initial snapshot
var INIT_SNAPSHOT = _Symbol2['default']();

exports.INIT_SNAPSHOT = INIT_SNAPSHOT;
// last snapshot
var LAST_SNAPSHOT = _Symbol2['default']();

exports.LAST_SNAPSHOT = LAST_SNAPSHOT;
// all lifecycle listeners
var LIFECYCLE = _Symbol2['default']();

exports.LIFECYCLE = LIFECYCLE;
// store action listeners
var LISTENERS = _Symbol2['default']();

exports.LISTENERS = LISTENERS;
// public methods
var PUBLIC_METHODS = _Symbol2['default']();

exports.PUBLIC_METHODS = PUBLIC_METHODS;
// contains all state
var STATE_CONTAINER = _Symbol2['default']();
exports.STATE_CONTAINER = STATE_CONTAINER;

},{"es-symbol":1}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getInternalMethods = getInternalMethods;
exports.warn = warn;
exports.uid = uid;
exports.formatAsConstant = formatAsConstant;
exports.dispatchIdentity = dispatchIdentity;
/* istanbul ignore next */
function NoopClass() {}

var builtIns = Object.getOwnPropertyNames(NoopClass);
var builtInProto = Object.getOwnPropertyNames(NoopClass.prototype);

function getInternalMethods(obj, isProto) {
  var excluded = isProto ? builtInProto : builtIns;
  return Object.getOwnPropertyNames(obj).reduce(function (value, m) {
    if (excluded.indexOf(m) !== -1) {
      return value;
    }

    value[m] = obj[m];
    return value;
  }, {});
}

function warn(msg) {
  /* istanbul ignore else */
  if (typeof console !== 'undefined') {
    console.warn(new ReferenceError(msg));
  }
}

function uid(container, name) {
  var count = 0;
  var key = name;
  while (Object.hasOwnProperty.call(container, key)) {
    key = name + String(++count);
  }
  return key;
}

function formatAsConstant(name) {
  return name.replace(/[a-z]([A-Z])/g, function (i) {
    return '' + i[0] + '_' + i[1].toLowerCase();
  }).toUpperCase();
}

function dispatchIdentity(x) {
  for (var _len = arguments.length, a = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    a[_key - 1] = arguments[_key];
  }

  this.dispatch(a.length ? [x].concat(a) : x);
}

},{}],11:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.setAppState = setAppState;
exports.snapshot = snapshot;
exports.saveInitialSnapshot = saveInitialSnapshot;
exports.filterSnapshots = filterSnapshots;

var _assign = require('object-assign');

var _assign2 = _interopRequireWildcard(_assign);

var _import = require('../symbols/symbols');

var Sym = _interopRequireWildcard(_import);

var INIT_SNAPSHOT = Sym.INIT_SNAPSHOT;
var LAST_SNAPSHOT = Sym.LAST_SNAPSHOT;
var LIFECYCLE = Sym.LIFECYCLE;
var STATE_CONTAINER = Sym.STATE_CONTAINER;

function setAppState(instance, data, onStore) {
  var obj = instance.deserialize(data);
  Object.keys(obj).forEach(function (key) {
    var store = instance.stores[key];
    if (store) {
      var config = store.StoreModel.config;

      if (config.onDeserialize) {
        obj[key] = config.onDeserialize(obj[key]) || obj[key];
      }
      _assign2['default'](store[STATE_CONTAINER], obj[key]);
      onStore(store);
    }
  });
}

function snapshot(instance) {
  var storeNames = arguments[1] === undefined ? [] : arguments[1];

  var stores = storeNames.length ? storeNames : Object.keys(instance.stores);
  return stores.reduce(function (obj, storeHandle) {
    var storeName = storeHandle.displayName || storeHandle;
    var store = instance.stores[storeName];
    var config = store.StoreModel.config;

    if (store[LIFECYCLE].snapshot) {
      store[LIFECYCLE].snapshot();
    }
    var customSnapshot = config.onSerialize && config.onSerialize(store[STATE_CONTAINER]);
    obj[storeName] = customSnapshot ? customSnapshot : store.getState();
    return obj;
  }, {});
}

function saveInitialSnapshot(instance, key) {
  var state = instance.deserialize(instance.serialize(instance.stores[key][STATE_CONTAINER]));
  instance[INIT_SNAPSHOT][key] = state;
  instance[LAST_SNAPSHOT][key] = state;
}

function filterSnapshots(instance, state, stores) {
  return stores.reduce(function (obj, store) {
    var storeName = store.displayName || store;
    if (!state[storeName]) {
      throw new ReferenceError('' + storeName + ' is not a valid store');
    }
    obj[storeName] = state[storeName];
    return obj;
  }, {});
}

},{"../symbols/symbols":9,"object-assign":6}],12:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Symbol = require('es-symbol');

var _Symbol2 = _interopRequireWildcard(_Symbol);

var _ACTION_KEY$ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS = require('../symbols/symbols');

var StoreMixinEssentials = {
  waitFor: function waitFor(sources) {
    if (!sources) {
      throw new ReferenceError('Dispatch tokens not provided');
    }

    if (arguments.length === 1) {
      sources = Array.isArray(sources) ? sources : [sources];
    } else {
      sources = Array.prototype.slice.call(arguments);
    }

    var tokens = sources.map(function (source) {
      return source.dispatchToken || source;
    });

    this.dispatcher.waitFor(tokens);
  },

  exportPublicMethods: function exportPublicMethods(methods) {
    var _this = this;

    Object.keys(methods).forEach(function (methodName) {
      if (typeof methods[methodName] !== 'function') {
        throw new TypeError('exportPublicMethods expects a function');
      }

      _this[_ACTION_KEY$ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS.PUBLIC_METHODS][methodName] = methods[methodName];
    });
  },

  emitChange: function emitChange() {
    this.getInstance().emitChange();
  }
};

exports.StoreMixinEssentials = StoreMixinEssentials;
var StoreMixinListeners = {
  on: function on(lifecycleEvent, handler) {
    this[_ACTION_KEY$ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS.LIFECYCLE][lifecycleEvent] = handler.bind(this);
  },

  bindAction: function bindAction(symbol, handler) {
    if (!symbol) {
      throw new ReferenceError('Invalid action reference passed in');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('bindAction expects a function');
    }

    if (handler.length > 1) {
      throw new TypeError('Action handler in store ' + this._storeName + ' for ' + ('' + (symbol[_ACTION_KEY$ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS.ACTION_KEY] || symbol).toString() + ' was defined with 2 ') + 'parameters. Only a single parameter is passed through the ' + 'dispatcher, did you mean to pass in an Object instead?');
    }

    // You can pass in the constant or the function itself
    var key = symbol[_ACTION_KEY$ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS.ACTION_KEY] ? symbol[_ACTION_KEY$ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS.ACTION_KEY] : symbol;
    this[_ACTION_KEY$ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS.LISTENERS][key] = handler.bind(this);
    this[_ACTION_KEY$ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS.ALL_LISTENERS].push(_Symbol2['default'].keyFor(key));
  },

  bindActions: function bindActions(actions) {
    var _this2 = this;

    Object.keys(actions).forEach(function (action) {
      var symbol = actions[action];
      var matchFirstCharacter = /./;
      var assumedEventHandler = action.replace(matchFirstCharacter, function (x) {
        return 'on' + x[0].toUpperCase();
      });
      var handler = null;

      if (_this2[action] && _this2[assumedEventHandler]) {
        // If you have both action and onAction
        throw new ReferenceError('You have multiple action handlers bound to an action: ' + ('' + action + ' and ' + assumedEventHandler));
      } else if (_this2[action]) {
        // action
        handler = _this2[action];
      } else if (_this2[assumedEventHandler]) {
        // onAction
        handler = _this2[assumedEventHandler];
      }

      if (handler) {
        _this2.bindAction(symbol, handler);
      }
    });
  },

  bindListeners: function bindListeners(obj) {
    var _this3 = this;

    Object.keys(obj).forEach(function (methodName) {
      var symbol = obj[methodName];
      var listener = _this3[methodName];

      if (!listener) {
        throw new ReferenceError('' + methodName + ' defined but does not exist in ' + _this3._storeName);
      }

      if (Array.isArray(symbol)) {
        symbol.forEach(function (action) {
          _this3.bindAction(action, listener);
        });
      } else {
        _this3.bindAction(symbol, listener);
      }
    });
  }

};
exports.StoreMixinListeners = StoreMixinListeners;

},{"../symbols/symbols":9,"es-symbol":1}],13:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _bind = Function.prototype.bind;

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.createStoreConfig = createStoreConfig;
exports.transformStore = transformStore;
exports.createStoreFromObject = createStoreFromObject;
exports.createStoreFromClass = createStoreFromClass;

var _assign = require('object-assign');

var _assign2 = _interopRequireWildcard(_assign);

var _AltStore = require('../AltStore');

var _AltStore2 = _interopRequireWildcard(_AltStore);

var _getInternalMethods = require('./AltUtils');

var _StoreMixinEssentials$StoreMixinListeners = require('./StoreMixins');

var _ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER = require('../symbols/symbols');

function doSetState(store, storeInstance, state) {
  if (!state) {
    return;
  }

  var config = storeInstance.StoreModel.config;

  var nextState = typeof state === 'function' ? state(storeInstance[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.STATE_CONTAINER]) : state;

  storeInstance[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.STATE_CONTAINER] = config.setState.call(store, storeInstance[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.STATE_CONTAINER], nextState);

  if (!store.alt.dispatcher.isDispatching()) {
    store.emitChange();
  }
}

function createStoreConfig(globalConfig, StoreModel) {
  StoreModel.config = _assign2['default']({
    getState: function getState(state) {
      return Object.keys(state).reduce(function (obj, key) {
        obj[key] = state[key];
        return obj;
      }, {});
    },
    setState: _assign2['default']
  }, globalConfig, StoreModel.config);
}

function transformStore(transforms, StoreModel) {
  return transforms.reduce(function (Store, transform) {
    return transform(Store);
  }, StoreModel);
}

function createStoreFromObject(alt, StoreModel, key) {
  var storeInstance = undefined;

  var StoreProto = {};
  StoreProto[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.ALL_LISTENERS] = [];
  StoreProto[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.LIFECYCLE] = {};
  StoreProto[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.LISTENERS] = {};

  _assign2['default'](StoreProto, {
    _storeName: key,
    alt: alt,
    dispatcher: alt.dispatcher,
    getInstance: function getInstance() {
      return storeInstance;
    },
    setState: function setState(nextState) {
      doSetState(this, storeInstance, nextState);
    }
  }, _StoreMixinEssentials$StoreMixinListeners.StoreMixinListeners, _StoreMixinEssentials$StoreMixinListeners.StoreMixinEssentials, StoreModel);

  // bind the store listeners
  /* istanbul ignore else */
  if (StoreProto.bindListeners) {
    _StoreMixinEssentials$StoreMixinListeners.StoreMixinListeners.bindListeners.call(StoreProto, StoreProto.bindListeners);
  }

  // bind the lifecycle events
  /* istanbul ignore else */
  if (StoreProto.lifecycle) {
    Object.keys(StoreProto.lifecycle).forEach(function (event) {
      _StoreMixinEssentials$StoreMixinListeners.StoreMixinListeners.on.call(StoreProto, event, StoreProto.lifecycle[event]);
    });
  }

  // create the instance and assign the public methods to the instance
  storeInstance = _assign2['default'](new _AltStore2['default'](alt, StoreProto, StoreProto.state, StoreModel), StoreProto.publicMethods, { displayName: key });

  return storeInstance;
}

function createStoreFromClass(alt, StoreModel, key) {
  for (var _len = arguments.length, argsForClass = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    argsForClass[_key - 3] = arguments[_key];
  }

  var storeInstance = undefined;
  var config = StoreModel.config;

  // Creating a class here so we don't overload the provided store's
  // prototype with the mixin behaviour and I'm extending from StoreModel
  // so we can inherit any extensions from the provided store.

  var Store = (function (_StoreModel) {
    function Store() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      _classCallCheck(this, Store);

      _get(Object.getPrototypeOf(Store.prototype), 'constructor', this).apply(this, args);
    }

    _inherits(Store, _StoreModel);

    return Store;
  })(StoreModel);

  _assign2['default'](Store.prototype, _StoreMixinEssentials$StoreMixinListeners.StoreMixinListeners, _StoreMixinEssentials$StoreMixinListeners.StoreMixinEssentials, {
    _storeName: key,
    alt: alt,
    dispatcher: alt.dispatcher,
    getInstance: function getInstance() {
      return storeInstance;
    },
    setState: function setState(nextState) {
      doSetState(this, storeInstance, nextState);
    }
  });

  Store.prototype[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.ALL_LISTENERS] = [];
  Store.prototype[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.LIFECYCLE] = {};
  Store.prototype[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.LISTENERS] = {};
  Store.prototype[_ALL_LISTENERS$LIFECYCLE$LISTENERS$PUBLIC_METHODS$STATE_CONTAINER.PUBLIC_METHODS] = {};

  var store = new (_bind.apply(Store, [null].concat(argsForClass)))();

  storeInstance = _assign2['default'](new _AltStore2['default'](alt, store, store[alt.config.stateKey] || store[config.stateKey] || null, StoreModel), _getInternalMethods.getInternalMethods(StoreModel), { displayName: key });

  return storeInstance;
}

},{"../AltStore":8,"../symbols/symbols":9,"./AltUtils":10,"./StoreMixins":12,"object-assign":6}],14:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = makeAction;

var _import = require('../symbols/symbols');

var Sym = _interopRequireWildcard(_import);

var _Symbol = require('es-symbol');

var _Symbol2 = _interopRequireWildcard(_Symbol);

var _AltAction = require('../AltAction');

var _AltAction2 = _interopRequireWildcard(_AltAction);

var _uid = require('./AltUtils');

var ACTION_KEY = Sym.ACTION_KEY;
var ACTION_HANDLER = Sym.ACTION_HANDLER;
var ACTIONS_REGISTRY = Sym.ACTIONS_REGISTRY;

function makeAction(alt, namespace, name, implementation, obj) {
  // make sure each Symbol is unique
  var actionId = _uid.uid(alt[ACTIONS_REGISTRY], '' + namespace + '.' + name);
  alt[ACTIONS_REGISTRY][actionId] = 1;
  var actionSymbol = _Symbol2['default']['for']('alt/' + actionId);

  // Wrap the action so we can provide a dispatch method
  var newAction = new _AltAction2['default'](alt, actionSymbol, implementation, obj);

  // the action itself
  var action = newAction[ACTION_HANDLER];
  action.defer = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    setTimeout(function () {
      newAction[ACTION_HANDLER].apply(null, args);
    });
  };
  action[ACTION_KEY] = actionSymbol;

  // ensure each reference is unique in the namespace
  var container = alt.actions[namespace];
  var id = _uid.uid(container, name);
  container[id] = action;

  return action;
}

module.exports = exports['default'];

},{"../AltAction":7,"../symbols/symbols":9,"./AltUtils":10,"es-symbol":1}],15:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _bind = Function.prototype.bind;

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _assign = require('object-assign');

var _assign2 = _interopRequireWildcard(_assign);

var _Dispatcher = require('flux');

var _makeAction = require('./utils/makeAction');

var _makeAction2 = _interopRequireWildcard(_makeAction);

var _filterSnapshots$saveInitialSnapshot$setAppState$snapshot = require('./utils/StateFunctions');

var _createStoreConfig$createStoreFromObject$createStoreFromClass$transformStore = require('./utils/StoreUtils');

var _ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE = require('./symbols/symbols');

var _dispatchIdentity$formatAsConstant$getInternalMethods$uid$warn = require('./utils/AltUtils');

var Alt = (function () {
  function Alt() {
    var config = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Alt);

    this.config = config;
    this.serialize = config.serialize || JSON.stringify;
    this.deserialize = config.deserialize || JSON.parse;
    this.dispatcher = config.dispatcher || new _Dispatcher.Dispatcher();
    this.actions = { global: {} };
    this.stores = {};
    this.storeTransforms = config.storeTransforms || [];
    this[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.ACTIONS_REGISTRY] = {};
    this[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.INIT_SNAPSHOT] = {};
    this[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.LAST_SNAPSHOT] = {};
  }

  _createClass(Alt, [{
    key: 'dispatch',
    value: function dispatch(action, data) {
      this.dispatcher.dispatch({ action: action, data: data });
    }
  }, {
    key: 'createUnsavedStore',
    value: function createUnsavedStore(StoreModel) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var key = StoreModel.displayName || '';
      _createStoreConfig$createStoreFromObject$createStoreFromClass$transformStore.createStoreConfig(this.config, StoreModel);
      var Store = _createStoreConfig$createStoreFromObject$createStoreFromClass$transformStore.transformStore(this.storeTransforms, StoreModel);

      return typeof Store === 'object' ? _createStoreConfig$createStoreFromObject$createStoreFromClass$transformStore.createStoreFromObject(this, Store, key) : _createStoreConfig$createStoreFromObject$createStoreFromClass$transformStore.createStoreFromClass.apply(undefined, [this, Store, key].concat(args));
    }
  }, {
    key: 'createStore',
    value: function createStore(StoreModel, iden) {
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      var key = iden || StoreModel.displayName || StoreModel.name || '';
      _createStoreConfig$createStoreFromObject$createStoreFromClass$transformStore.createStoreConfig(this.config, StoreModel);
      var Store = _createStoreConfig$createStoreFromObject$createStoreFromClass$transformStore.transformStore(this.storeTransforms, StoreModel);

      if (this.stores[key] || !key) {
        if (this.stores[key]) {
          _dispatchIdentity$formatAsConstant$getInternalMethods$uid$warn.warn('A store named ' + key + ' already exists, double check your store ' + 'names or pass in your own custom identifier for each store');
        } else {
          _dispatchIdentity$formatAsConstant$getInternalMethods$uid$warn.warn('Store name was not specified');
        }

        key = _dispatchIdentity$formatAsConstant$getInternalMethods$uid$warn.uid(this.stores, key);
      }

      var storeInstance = typeof Store === 'object' ? _createStoreConfig$createStoreFromObject$createStoreFromClass$transformStore.createStoreFromObject(this, Store, key) : _createStoreConfig$createStoreFromObject$createStoreFromClass$transformStore.createStoreFromClass.apply(undefined, [this, Store, key].concat(args));

      this.stores[key] = storeInstance;
      _filterSnapshots$saveInitialSnapshot$setAppState$snapshot.saveInitialSnapshot(this, key);

      return storeInstance;
    }
  }, {
    key: 'generateActions',
    value: function generateActions() {
      for (var _len3 = arguments.length, actionNames = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        actionNames[_key3] = arguments[_key3];
      }

      var actions = { name: 'global' };
      return this.createActions(actionNames.reduce(function (obj, action) {
        obj[action] = _dispatchIdentity$formatAsConstant$getInternalMethods$uid$warn.dispatchIdentity;
        return obj;
      }, actions));
    }
  }, {
    key: 'createAction',
    value: function createAction(name, implementation, obj) {
      return _makeAction2['default'](this, 'global', name, implementation, obj);
    }
  }, {
    key: 'createActions',
    value: function createActions(ActionsClass) {
      var _this = this;

      for (var _len4 = arguments.length, argsForConstructor = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
        argsForConstructor[_key4 - 2] = arguments[_key4];
      }

      var exportObj = arguments[1] === undefined ? {} : arguments[1];

      var actions = {};
      var key = _dispatchIdentity$formatAsConstant$getInternalMethods$uid$warn.uid(this[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.ACTIONS_REGISTRY], ActionsClass.displayName || ActionsClass.name || 'Unknown');

      if (typeof ActionsClass === 'function') {
        (function () {
          _assign2['default'](actions, _dispatchIdentity$formatAsConstant$getInternalMethods$uid$warn.getInternalMethods(ActionsClass.prototype, true));

          var ActionsGenerator = (function (_ActionsClass) {
            function ActionsGenerator() {
              for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                args[_key5] = arguments[_key5];
              }

              _classCallCheck(this, ActionsGenerator);

              _get(Object.getPrototypeOf(ActionsGenerator.prototype), 'constructor', this).apply(this, args);
            }

            _inherits(ActionsGenerator, _ActionsClass);

            _createClass(ActionsGenerator, [{
              key: 'generateActions',
              value: function generateActions() {
                for (var _len6 = arguments.length, actionNames = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                  actionNames[_key6] = arguments[_key6];
                }

                actionNames.forEach(function (actionName) {
                  actions[actionName] = _dispatchIdentity$formatAsConstant$getInternalMethods$uid$warn.dispatchIdentity;
                });
              }
            }]);

            return ActionsGenerator;
          })(ActionsClass);

          _assign2['default'](actions, new (_bind.apply(ActionsGenerator, [null].concat(argsForConstructor)))());
        })();
      } else {
        _assign2['default'](actions, ActionsClass);
      }

      this.actions[key] = this.actions[key] || {};

      return Object.keys(actions).reduce(function (obj, action) {
        if (typeof actions[action] !== 'function') {
          return obj;
        }

        // create the action
        obj[action] = _makeAction2['default'](_this, key, action, actions[action], obj);

        // generate a constant
        var constant = _dispatchIdentity$formatAsConstant$getInternalMethods$uid$warn.formatAsConstant(action);
        obj[constant] = obj[action][_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.ACTION_KEY];

        return obj;
      }, exportObj);
    }
  }, {
    key: 'takeSnapshot',
    value: function takeSnapshot() {
      for (var _len7 = arguments.length, storeNames = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        storeNames[_key7] = arguments[_key7];
      }

      var state = _filterSnapshots$saveInitialSnapshot$setAppState$snapshot.snapshot(this, storeNames);
      _assign2['default'](this[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.LAST_SNAPSHOT], state);
      return this.serialize(state);
    }
  }, {
    key: 'rollback',
    value: function rollback() {
      _filterSnapshots$saveInitialSnapshot$setAppState$snapshot.setAppState(this, this.serialize(this[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.LAST_SNAPSHOT]), function (store) {
        if (store[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.LIFECYCLE].rollback) {
          store[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.LIFECYCLE].rollback();
        }
        store.emitChange();
      });
    }
  }, {
    key: 'recycle',
    value: function recycle() {
      for (var _len8 = arguments.length, storeNames = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        storeNames[_key8] = arguments[_key8];
      }

      var initialSnapshot = storeNames.length ? _filterSnapshots$saveInitialSnapshot$setAppState$snapshot.filterSnapshots(this, this[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.INIT_SNAPSHOT], storeNames) : this[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.INIT_SNAPSHOT];

      _filterSnapshots$saveInitialSnapshot$setAppState$snapshot.setAppState(this, this.serialize(initialSnapshot), function (store) {
        if (store[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.LIFECYCLE].init) {
          store[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.LIFECYCLE].init();
        }
        store.emitChange();
      });
    }
  }, {
    key: 'flush',
    value: function flush() {
      var state = this.serialize(_filterSnapshots$saveInitialSnapshot$setAppState$snapshot.snapshot(this));
      this.recycle();
      return state;
    }
  }, {
    key: 'bootstrap',
    value: function bootstrap(data) {
      _filterSnapshots$saveInitialSnapshot$setAppState$snapshot.setAppState(this, data, function (store) {
        if (store[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.LIFECYCLE].bootstrap) {
          store[_ACTION_KEY$ACTIONS_REGISTRY$INIT_SNAPSHOT$LAST_SNAPSHOT$LIFECYCLE.LIFECYCLE].bootstrap();
        }
        store.emitChange();
      });
    }
  }, {
    key: 'prepare',
    value: function prepare(store, payload) {
      var data = {};
      if (!store._storeName) {
        throw new ReferenceError('Store provided does not have a name');
      }
      data[store._storeName] = payload;
      return this.serialize(data);
    }
  }, {
    key: 'addActions',

    // Instance type methods for injecting alt into your application as context

    value: function addActions(name, ActionsClass) {
      for (var _len9 = arguments.length, args = Array(_len9 > 2 ? _len9 - 2 : 0), _key9 = 2; _key9 < _len9; _key9++) {
        args[_key9 - 2] = arguments[_key9];
      }

      this.actions[name] = Array.isArray(ActionsClass) ? this.generateActions.apply(this, ActionsClass) : this.createActions.apply(this, [ActionsClass].concat(args));
    }
  }, {
    key: 'addStore',
    value: function addStore(name, StoreModel) {
      for (var _len10 = arguments.length, args = Array(_len10 > 2 ? _len10 - 2 : 0), _key10 = 2; _key10 < _len10; _key10++) {
        args[_key10 - 2] = arguments[_key10];
      }

      this.createStore.apply(this, [StoreModel, name].concat(args));
    }
  }, {
    key: 'getActions',
    value: function getActions(name) {
      return this.actions[name];
    }
  }, {
    key: 'getStore',
    value: function getStore(name) {
      return this.stores[name];
    }
  }]);

  return Alt;
})();

exports['default'] = Alt;
module.exports = exports['default'];

},{"./symbols/symbols":9,"./utils/AltUtils":10,"./utils/StateFunctions":11,"./utils/StoreUtils":13,"./utils/makeAction":14,"flux":3,"object-assign":6}]},{},[15])(15)
});