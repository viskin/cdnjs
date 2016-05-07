/*! angular-vertxbus - v2.0.0-beta.5 - 2015-05-02
* http://github.com/knalli/angular-vertxbus
* Copyright (c) 2015 Jan Philipp; Licensed MIT */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var moduleName = 'knalli.angular-vertxbus';

exports.moduleName = moduleName;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _moduleName = require('./config');

require('./vertxbus-module');

require('./vertxbus-wrapper');

require('./vertxbus-service');

exports['default'] = _moduleName.moduleName;
module.exports = exports['default'];

},{"./config":1,"./vertxbus-module":12,"./vertxbus-service":13,"./vertxbus-wrapper":14}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*
 Simple queue implementation

 FIFO: #push() + #first()
 LIFO: #push() + #last()
 */

var Queue = (function () {
  function Queue() {
    var maxSize = arguments[0] === undefined ? 10 : arguments[0];

    _classCallCheck(this, Queue);

    this.maxSize = maxSize;
    this.items = [];
  }

  _createClass(Queue, [{
    key: "push",
    value: function push(item) {
      this.items.push(item);
      return this.recalibrateBufferSize();
    }
  }, {
    key: "recalibrateBufferSize",
    value: function recalibrateBufferSize() {
      while (this.items.length > this.maxSize) {
        this.first();
      }
      return this;
    }
  }, {
    key: "last",
    value: function last() {
      return this.items.pop();
    }
  }, {
    key: "first",
    value: function first() {
      return this.items.shift(0);
    }
  }, {
    key: "size",
    value: function size() {
      return this.items.length;
    }
  }]);

  return Queue;
})();

exports["default"] = Queue;
module.exports = exports["default"];

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*
 Simple Map implementation

 This implementation allows usage of non serializable keys for values.
 */

var SimpleMap = (function () {
  function SimpleMap() {
    _classCallCheck(this, SimpleMap);

    this.clear();
  }

  _createClass(SimpleMap, [{
    key: "put",

    // Stores the value under the key.
    // Chainable
    value: function put(key, value) {
      var idx = this._indexForKey(key);
      if (idx > -1) {
        this.values[idx] = value;
      } else {
        this.keys.push(key);
        this.values.push(value);
      }
      return this;
    }
  }, {
    key: "get",

    // Returns value for key, otherwise undefined.
    value: function get(key) {
      var idx = this._indexForKey(key);
      if (idx > -1) {
        return this.values[idx];
      }
    }
  }, {
    key: "containsKey",

    // Returns true if the key exists.
    value: function containsKey(key) {
      var idx = this._indexForKey(key);
      return idx > -1;
    }
  }, {
    key: "containsValue",

    // Returns true if the value exists.
    value: function containsValue(value) {
      var idx = this._indexForValue(value);
      return idx > -1;
    }
  }, {
    key: "remove",

    // Removes the key and its value.
    value: function remove(key) {
      var idx = this._indexForKey(key);
      if (idx > -1) {
        this.keys[idx] = undefined;
        this.values[idx] = undefined;
      }
    }
  }, {
    key: "clear",

    // Clears all keys and values.
    value: function clear() {
      this.keys = [];
      this.values = [];
      return this;
    }
  }, {
    key: "_indexForKey",

    // Returns index of key, otherwise -1.
    value: function _indexForKey(key) {
      for (var i in this.keys) {
        if (key === this.keys[i]) {
          return i;
        }
      }
      return -1;
    }
  }, {
    key: "_indexForValue",
    value: function _indexForValue(value) {
      for (var i in this.values) {
        if (value === this.values[i]) {
          return i;
        }
      }
      return -1;
    }
  }]);

  return SimpleMap;
})();

exports["default"] = SimpleMap;
module.exports = exports["default"];

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _moduleName = require('../../config.js');

var InterfaceService = (function () {
  function InterfaceService(delegate, $log) {
    var _this = this;

    _classCallCheck(this, InterfaceService);

    this.delegate = delegate;
    this.$log = $log;
    this.handlers = [];
    this.delegate.observe({
      afterEventbusConnected: function afterEventbusConnected() {
        return _this.afterEventbusConnected();
      }
    });
  }

  _createClass(InterfaceService, [{
    key: 'afterEventbusConnected',
    value: function afterEventbusConnected() {
      for (var address in this.handlers) {
        var callbacks = this.handlers[address];
        if (callbacks && callbacks.length) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = callbacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var callback = _step.value;

              this.delegate.registerHandler(address, callback);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator['return']) {
                _iterator['return']();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
      }
    }
  }, {
    key: 'registerHandler',
    value: function registerHandler(address, callback) {
      var _this2 = this;

      if (!this.handlers[address]) {
        this.handlers[address] = [];
      }
      this.handlers[address].push(callback);
      var unregisterFn = null;
      if (this.delegate.isConnectionOpen()) {
        this.delegate.registerHandler(address, callback);
        unregisterFn = function () {
          return _this2.delegate.unregisterHandler(address, callback);
        };
      }
      // and return the deregister callback
      var deconstructor = function deconstructor() {
        if (unregisterFn) {
          unregisterFn();
          unregisterFn = undefined;
        }
        // Remove from internal map
        if (_this2.handlers[address]) {
          var index = _this2.handlers[address].indexOf(callback);
          if (index > -1) {
            _this2.handlers[address].splice(index, 1);
          }
          if (_this2.handlers[address].length < 1) {
            _this2.handlers[address] = undefined;
          }
        }
      };
      deconstructor.displayName = '' + _moduleName.moduleName + '.service.registerHandler.deconstructor';
      return deconstructor;
    }
  }, {
    key: 'on',
    value: function on(address, callback) {
      return this.registerHandler(address, callback);
    }
  }, {
    key: 'addListener',
    value: function addListener(address, callback) {
      return this.registerHandler(address, callback);
    }
  }, {
    key: 'unregisterHandler',
    value: function unregisterHandler(address, callback) {
      // Remove from internal map
      if (this.handlers[address]) {
        var index = this.handlers[address].indexOf(callback);
        if (index > -1) {
          this.handlers[address].splice(index, 1);
        }
        if (this.handlers[address].length < 1) {
          this.handlers[address] = undefined;
        }
      }
      // Remove from real instance
      if (this.delegate.isConnectionOpen()) {
        this.delegate.unregisterHandler(address, callback);
      }
    }
  }, {
    key: 'un',
    value: function un(address, callback) {
      return this.unregisterHandler(address, callback);
    }
  }, {
    key: 'removeListener',
    value: function removeListener(address, callback) {
      return this.unregisterHandler(address, callback);
    }
  }, {
    key: 'send',
    value: function send(address, message) {
      var options = arguments[2] === undefined ? {} : arguments[2];

      // FALLBACK: signature change since 2.0
      if (!angular.isObject(options)) {
        this.$log.error('' + _moduleName.moduleName + ': Signature of vertxEventBusService.send() has been changed!');
        return this.send(address, message, {
          timeout: arguments[2] !== undefined ? arguments[2] : 10000,
          expectReply: arguments[3] !== undefined ? arguments[3] : true
        });
      }

      return this.delegate.send(address, message, options.timeout, options.expectReply);
    }
  }, {
    key: 'publish',
    value: function publish(address, message) {
      return this.delegate.publish(address, message);
    }
  }, {
    key: 'emit',
    value: function emit(address, message) {
      return this.publish(address, message);
    }
  }, {
    key: 'getConnectionState',
    value: function getConnectionState() {
      return this.delegate.getConnectionState();
    }
  }, {
    key: 'readyState',
    value: function readyState() {
      return this.getConnectionState();
    }
  }, {
    key: 'isEnabled',
    value: function isEnabled() {
      return this.delegate.isEnabled();
    }
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return this.delegate.isConnected();
    }
  }, {
    key: 'login',
    value: function login(username, password, timeout) {
      return this.delegate.login(username, password, timeout);
    }
  }]);

  return InterfaceService;
})();

exports['default'] = InterfaceService;
module.exports = exports['default'];

},{"../../config.js":1}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var BaseDelegate = (function () {
  function BaseDelegate() {
    _classCallCheck(this, BaseDelegate);
  }

  _createClass(BaseDelegate, [{
    key: "getConnectionState",
    value: function getConnectionState() {
      return 3; // CLOSED
    }
  }, {
    key: "isConnectionOpen",
    value: function isConnectionOpen() {
      return false;
    }
  }, {
    key: "isValidSession",
    value: function isValidSession() {
      return false;
    }
  }, {
    key: "isEnabled",
    value: function isEnabled() {
      return false;
    }
  }, {
    key: "isConnected",
    value: function isConnected() {
      return false;
    }
  }, {
    key: "send",
    value: function send() {}
  }, {
    key: "publish",
    value: function publish() {}
  }]);

  return BaseDelegate;
})();

exports["default"] = BaseDelegate;
module.exports = exports["default"];

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x6, _x7, _x8) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x6,
    property = _x7,
    receiver = _x8; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x6 = parent; _x7 = property; _x8 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _moduleName = require('../../../config.js');

var _Queue = require('./../../helpers/Queue');

var _Queue2 = _interopRequireDefault(_Queue);

var _SimpleMap = require('./../../helpers/SimpleMap');

var _SimpleMap2 = _interopRequireDefault(_SimpleMap);

var _BaseDelegate2 = require('./Base');

var _BaseDelegate3 = _interopRequireDefault(_BaseDelegate2);

var LiveDelegate = (function (_BaseDelegate) {
  function LiveDelegate($rootScope, $interval, $log, $q, eventBus, _ref) {
    var enabled = _ref.enabled;
    var debugEnabled = _ref.debugEnabled;
    var prefix = _ref.prefix;
    var urlServer = _ref.urlServer;
    var urlPath = _ref.urlPath;
    var reconnectEnabled = _ref.reconnectEnabled;
    var sockjsStateInterval = _ref.sockjsStateInterval;
    var sockjsReconnectInterval = _ref.sockjsReconnectInterval;
    var sockjsOptions = _ref.sockjsOptions;
    var messageBuffer = _ref.messageBuffer;
    var loginRequired = _ref.loginRequired;

    _classCallCheck(this, LiveDelegate);

    _get(Object.getPrototypeOf(LiveDelegate.prototype), 'constructor', this).call(this);
    this.$rootScope = $rootScope;
    this.$interval = $interval;
    this.$log = $log;
    this.$q = $q;
    this.eventBus = eventBus;
    this.options = {
      enabled: enabled,
      debugEnabled: debugEnabled,
      prefix: prefix,
      urlServer: urlServer,
      urlPath: urlPath,
      reconnectEnabled: reconnectEnabled,
      sockjsStateInterval: sockjsStateInterval,
      sockjsReconnectInterval: sockjsReconnectInterval,
      sockjsOptions: sockjsOptions,
      messageBuffer: messageBuffer,
      loginRequired: loginRequired
    };
    this.connectionState = this.eventBus.EventBus.CLOSED;
    this.states = {
      connected: false,
      validSession: false
    };
    this.observers = [];
    // internal store of buffered messages
    this.messageQueue = new _Queue2['default'](this.options.messageBuffer);
    // internal map of callbacks
    this.callbackMap = new _SimpleMap2['default']();
    // asap
    this.initialize();
  }

  _inherits(LiveDelegate, _BaseDelegate);

  _createClass(LiveDelegate, [{
    key: 'initialize',
    value: function initialize() {
      var _this2 = this;

      this.eventBus.onopen = function () {
        return _this2.onEventbusOpen();
      };
      this.eventBus.onclose = function () {
        return _this2.onEventbusClose();
      };

      // Update the current connection state periodically.
      var connectionIntervalCheck = function connectionIntervalCheck() {
        return _this2.getConnectionState(true);
      };
      connectionIntervalCheck.displayName = 'connectionIntervalCheck';
      this.$interval(function () {
        return connectionIntervalCheck();
      }, this.options.sockjsStateInterval);
    }
  }, {
    key: 'onEventbusOpen',
    value: function onEventbusOpen() {
      this.getConnectionState(true);
      if (!this.states.connected) {
        this.states.connected = true;
        this.$rootScope.$broadcast('' + this.options.prefix + 'system.connected');
      }
      this.afterEventbusConnected();
      this.$rootScope.$digest();
      // consume message queue?
      if (this.options.messageBuffer && this.messageQueue.size()) {
        while (this.messageQueue.size()) {
          var fn = this.messageQueue.first();
          if (angular.isFunction(fn)) {
            fn();
          }
        }
        this.$rootScope.$digest();
      }
    }
  }, {
    key: 'onEventbusClose',
    value: function onEventbusClose() {
      this.getConnectionState(true);
      if (this.states.connected) {
        this.states.connected = false;
        this.$rootScope.$broadcast('' + this.options.prefix + 'system.disconnected');
      }
    }
  }, {
    key: 'observe',
    value: function observe(observer) {
      this.observers.push(observer);
    }
  }, {
    key: 'afterEventbusConnected',
    value: function afterEventbusConnected() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.observers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var observer = _step.value;

          if (angular.isFunction(observer.afterEventbusConnected)) {
            observer.afterEventbusConnected();
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'registerHandler',

    /**
     * On message callback
     * @callback Eventbus~onMessageCallback
     * @param {object} message
     * @param {string} replyTo
     */

    /**
     * Register a callback handler for the specified address match.
     * @param {string} address
     * @param {Eventbus~onMessageCallback} callback
     * @returns {function=}
     */
    value: function registerHandler(address, callback) {
      var _this3 = this;

      if (!angular.isFunction(callback)) {
        return;
      }
      if (this.options.debugEnabled) {
        this.$log.debug('[Vert.x EB Service] Register handler for ' + address);
      }
      var callbackWrapper = function callbackWrapper(message, replyTo) {
        callback(message, replyTo);
        _this3.$rootScope.$digest();
      };
      callbackWrapper.displayName = '' + _moduleName.moduleName + '.service.delegate.live.registerHandler.callbackWrapper';
      this.callbackMap.put(callback, callbackWrapper);
      return this.eventBus.registerHandler(address, callbackWrapper);
    }
  }, {
    key: 'unregisterHandler',

    /**
     * Remove a callback handler for the specified address match.
     * @param {string} address
     * @param {Eventbus~onMessageCallback} callback
     */
    value: function unregisterHandler(address, callback) {
      if (!angular.isFunction(callback)) {
        return;
      }
      if (this.options.debugEnabled) {
        this.$log.debug('[Vert.x EB Service] Unregister handler for ' + address);
      }
      this.eventBus.unregisterHandler(address, this.callbackMap.get(callback));
      this.callbackMap.remove(callback);
    }
  }, {
    key: 'send',

    /**
     * Send a message to the specified address (using EventBus.send).
     * @param {string} address - targeting address in the bus
     * @param {object} message - payload
     * @param {number} [timeout=10000] - timeout (in ms) after which the promise will be rejected
     * @param {boolean} [expectReply=true] - if false, the promise will be resolved directly and
     *                                       no replyHandler will be created
     * @returns {promise}
     */
    value: function send(address, message) {
      var _this4 = this;

      var timeout = arguments[2] === undefined ? 10000 : arguments[2];
      var expectReply = arguments[3] === undefined ? true : arguments[3];

      var deferred = this.$q.defer();
      var next = function next() {
        if (expectReply) {
          (function () {
            // Register timeout for promise rejecting
            var timer = _this4.$interval(function () {
              if (_this4.options.debugEnabled) {
                _this4.$log.debug('[Vert.x EB Service] send(\'' + address + '\') timed out');
              }
              deferred.reject();
            }, timeout, 1);
            // Send message
            _this4.eventBus.send(address, message, function (reply) {
              _this4.$interval.cancel(timer); // because it's resolved
              deferred.resolve(reply);
            });
          })();
        } else {
          _this4.eventBus.send(address, message);
          deferred.resolve(); // we don't care
        }
      };
      next.displayName = '' + _moduleName.moduleName + '.service.delegate.live.send.next';
      if (!this.ensureOpenAuthConnection(next)) {
        deferred.reject();
      }
      return deferred.promise;
    }
  }, {
    key: 'publish',

    /**
     * Publish a message to the specified address (using EventBus.publish).
     * @param {string} address - targeting address in the bus
     * @param {object} message - payload
     */
    value: function publish(address, message) {
      var _this5 = this;

      return this.ensureOpenAuthConnection(function () {
        return _this5.eventBus.publish(address, message);
      });
    }
  }, {
    key: 'login',

    /**
     * Send a login message
     * @param {string} [options.username] username
     * @param {string} [options.password] password
     * @param {number} [timeout=5000]
     * @returns {promise}
     */
    value: function login() {
      var _this6 = this;

      var username = arguments[0] === undefined ? this.options.username : arguments[0];
      var password = arguments[1] === undefined ? this.options.password : arguments[1];
      var timeout = arguments[2] === undefined ? 5000 : arguments[2];

      var deferred = this.$q.defer();
      var next = function next(reply) {
        if (reply && reply.status === 'ok') {
          _this6.states.validSession = true;
          deferred.resolve(reply);
          _this6.$rootScope.$broadcast('' + _this6.options.prefix + 'system.login.succeeded', { status: reply.status });
        } else {
          _this6.states.validSession = false;
          deferred.reject(reply);
          _this6.$rootScope.$broadcast('' + _this6.options.prefix + 'system.login.failed', { status: reply.status });
        }
      };
      next.displayName = '' + _moduleName.moduleName + '.service.delegate.live.login.next';
      this.eventBus.login(username, password, next);
      this.$interval(function () {
        return deferred.reject();
      }, timeout, 1);
      return deferred.promise;
    }
  }, {
    key: 'ensureOpenConnection',
    value: function ensureOpenConnection(fn) {
      if (this.isConnectionOpen()) {
        fn();
        return true;
      } else if (this.options.messageBuffer) {
        this.messageQueue.push(fn);
        return true;
      }
      return false;
    }
  }, {
    key: 'ensureOpenAuthConnection',
    value: function ensureOpenAuthConnection(fn) {
      var _this7 = this;

      if (!this.options.loginRequired) {
        // easy: no login required
        return this.ensureOpenConnection(fn);
      } else {
        var fnWrapper = function fnWrapper() {
          if (_this7.states.validSession) {
            fn();
            return true;
          } else {
            // ignore this message
            if (_this7.options.debugEnabled) {
              _this7.$log.debug('[Vert.x EB Service] Message was not sent because login is required');
            }
            return false;
          }
        };
        fnWrapper.displayName = '' + _moduleName.moduleName + '.service.delegate.live.ensureOpenAuthConnection.fnWrapper';
        return this.ensureOpenConnection(fnWrapper);
      }
    }
  }, {
    key: 'getConnectionState',
    value: function getConnectionState(immediate) {
      if (this.options.enabled) {
        if (immediate) {
          this.connectionState = this.eventBus.readyState();
        }
      } else {
        this.connectionState = this.eventBus.EventBus.CLOSED;
      }
      return this.connectionState;
    }
  }, {
    key: 'isConnectionOpen',
    value: function isConnectionOpen() {
      return this.getConnectionState() === this.eventBus.EventBus.OPEN;
    }
  }, {
    key: 'isValidSession',
    value: function isValidSession() {
      return this.states.validSession;
    }
  }, {
    key: 'isConnected',
    value: function isConnected() {
      return this.states.connected;
    }
  }, {
    key: 'isEnabled',
    value: function isEnabled() {
      return this.options.enabled;
    }
  }, {
    key: 'getMessageQueueLength',
    value: function getMessageQueueLength() {
      return this.messageQueue.size();
    }
  }]);

  return LiveDelegate;
})(_BaseDelegate3['default']);

exports['default'] = LiveDelegate;
module.exports = exports['default'];

},{"../../../config.js":1,"./../../helpers/Queue":3,"./../../helpers/SimpleMap":4,"./Base":6}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _BaseDelegate2 = require('./Base');

var _BaseDelegate3 = _interopRequireDefault(_BaseDelegate2);

var NoopDelegate = (function (_BaseDelegate) {
  function NoopDelegate() {
    _classCallCheck(this, NoopDelegate);

    if (_BaseDelegate != null) {
      _BaseDelegate.apply(this, arguments);
    }
  }

  _inherits(NoopDelegate, _BaseDelegate);

  return NoopDelegate;
})(_BaseDelegate3['default']);

exports['default'] = NoopDelegate;
module.exports = exports['default'];

},{"./Base":6}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var BaseWrapper = (function () {
  function BaseWrapper() {
    _classCallCheck(this, BaseWrapper);
  }

  _createClass(BaseWrapper, [{
    key: "connect",
    value: function connect() {}
  }, {
    key: "reconnect",
    value: function reconnect() {}
  }, {
    key: "close",
    value: function close() {}
  }, {
    key: "login",
    value: function login(username, password, replyHandler) {}
  }, {
    key: "send",
    value: function send(address, message, replyHandler) {}
  }, {
    key: "publish",
    value: function publish(address, message) {}
  }, {
    key: "registerHandler",
    value: function registerHandler(address, handler) {}
  }, {
    key: "unregisterHandler",
    value: function unregisterHandler(address, handler) {}
  }, {
    key: "readyState",
    value: function readyState() {}
  }, {
    key: "getOptions",
    value: function getOptions() {
      return {};
    }
  }, {
    key: "onopen",

    // empty: can be overriden by externals
    value: function onopen() {}
  }, {
    key: "onclose",

    // empty: can be overriden by externals
    value: function onclose() {}
  }]);

  return BaseWrapper;
})();

exports["default"] = BaseWrapper;
module.exports = exports["default"];

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x2,
    property = _x3,
    receiver = _x4; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _moduleName = require('../../config.js');

var _BaseWrapper2 = require('./Base');

var _BaseWrapper3 = _interopRequireDefault(_BaseWrapper2);

var EventbusWrapper = (function (_BaseWrapper) {
  function EventbusWrapper(EventBus, $timeout, $log, _ref) {
    var enabled = _ref.enabled;
    var debugEnabled = _ref.debugEnabled;
    var prefix = _ref.prefix;
    var urlServer = _ref.urlServer;
    var urlPath = _ref.urlPath;
    var reconnectEnabled = _ref.reconnectEnabled;
    var sockjsStateInterval = _ref.sockjsStateInterval;
    var sockjsReconnectInterval = _ref.sockjsReconnectInterval;
    var sockjsOptions = _ref.sockjsOptions;
    var messageBuffer = _ref.messageBuffer;

    _classCallCheck(this, EventbusWrapper);

    _get(Object.getPrototypeOf(EventbusWrapper.prototype), 'constructor', this).call(this);
    // actual EventBus type
    this.EventBus = EventBus;
    this.$timeout = $timeout;
    this.$log = $log;
    this.options = {
      enabled: enabled,
      debugEnabled: debugEnabled,
      prefix: prefix,
      urlServer: urlServer,
      urlPath: urlPath,
      reconnectEnabled: reconnectEnabled,
      sockjsStateInterval: sockjsStateInterval,
      sockjsReconnectInterval: sockjsReconnectInterval,
      sockjsOptions: sockjsOptions,
      messageBuffer: messageBuffer
    };
    this.disconnectTimeoutEnabled = true;
    // asap create connection
    this.connect();
  }

  _inherits(EventbusWrapper, _BaseWrapper);

  _createClass(EventbusWrapper, [{
    key: 'connect',
    value: function connect() {
      var _this2 = this;

      var url = '' + this.options.urlServer + '' + this.options.urlPath;
      if (this.options.debugEnabled) {
        this.$log.debug('[Vert.x EB Stub] Enabled: connecting \'' + url + '\'');
      }
      // Because we have rebuild an EventBus object (because it have to rebuild a SockJS object)
      // we must wrap the object. Therefore, we have to mimic the behavior of onopen and onclose each time.
      this.instance = new this.EventBus(url, undefined, this.options.sockjsOptions);
      this.instance.onopen = function () {
        if (_this2.options.debugEnabled) {
          _this2.$log.debug('[Vert.x EB Stub] Connected');
        }
        if (angular.isFunction(_this2.onopen)) {
          _this2.onopen();
        }
      };
      // instance onClose handler
      this.instance.onclose = function () {
        if (_this2.options.debugEnabled) {
          _this2.$log.debug('[Vert.x EB Stub] Reconnect in ' + _this2.options.sockjsReconnectInterval + 'ms');
        }
        if (angular.isFunction(_this2.onclose)) {
          _this2.onclose();
        }
        _this2.instance = undefined;

        if (!_this2.disconnectTimeoutEnabled) {
          // reconnect required asap
          if (_this2.options.debugEnabled) {
            _this2.$log.debug('[Vert.x EB Stub] Reconnect immediately');
          }
          _this2.disconnectTimeoutEnabled = true;
          _this2.connect();
        } else if (_this2.options.reconnectEnabled) {
          // automatical reconnect after timeout
          if (_this2.options.debugEnabled) {
            _this2.$log.debug('[Vert.x EB Stub] Reconnect in ' + _this2.options.sockjsReconnectInterval + 'ms');
          }
          _this2.$timeout(function () {
            return _this2.connect();
          }, _this2.options.sockjsReconnectInterval);
        }
      };
    }
  }, {
    key: 'reconnect',
    value: function reconnect() {
      var immediately = arguments[0] === undefined ? false : arguments[0];

      if (this.instance && this.instance.readyState() === this.EventBus.OPEN) {
        if (immediately) {
          this.disconnectTimeoutEnabled = false;
        }
        this.instance.close();
      } else {
        this.connect();
      }
    }
  }, {
    key: 'close',
    value: function close() {
      if (this.instance) {
        return this.instance.close();
      }
    }
  }, {
    key: 'login',
    value: function login(username, password, replyHandler) {
      if (this.instance) {
        return this.instance.login(username, password, replyHandler);
      }
    }
  }, {
    key: 'send',
    value: function send(address, message, replyHandler) {
      if (this.instance) {
        return this.instance.send(address, message, replyHandler);
      }
    }
  }, {
    key: 'publish',
    value: function publish(address, message) {
      if (this.instance) {
        return this.instance.publish(address, message);
      }
    }
  }, {
    key: 'registerHandler',
    value: function registerHandler(address, handler) {
      var _this3 = this;

      if (this.instance) {
        this.instance.registerHandler(address, handler);
        // and return the deregister callback
        var deconstructor = function deconstructor() {
          _this3.unregisterHandler(address, handler);
        };
        deconstructor.displayName = '' + _moduleName.moduleName + '.wrapper.eventbus.registerHandler.deconstructor';
        return deconstructor;
      }
    }
  }, {
    key: 'unregisterHandler',
    value: function unregisterHandler(address, handler) {
      if (this.instance && this.instance.readyState() === this.EventBus.OPEN) {
        return this.instance.unregisterHandler(address, handler);
      }
    }
  }, {
    key: 'readyState',
    value: function readyState() {
      if (this.instance) {
        return this.instance.readyState();
      } else {
        return this.EventBus.CLOSED;
      }
    }
  }, {
    key: 'getOptions',
    value: function getOptions() {
      // clone options
      return angular.extend({}, this.options);
    }
  }]);

  return EventbusWrapper;
})(_BaseWrapper3['default']);

exports['default'] = EventbusWrapper;
module.exports = exports['default'];

},{"../../config.js":1,"./Base":9}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _BaseWrapper2 = require('./Base');

var _BaseWrapper3 = _interopRequireDefault(_BaseWrapper2);

var NoopWrapper = (function (_BaseWrapper) {
  function NoopWrapper() {
    _classCallCheck(this, NoopWrapper);

    if (_BaseWrapper != null) {
      _BaseWrapper.apply(this, arguments);
    }
  }

  _inherits(NoopWrapper, _BaseWrapper);

  return NoopWrapper;
})(_BaseWrapper3['default']);

exports['default'] = NoopWrapper;
module.exports = exports['default'];

},{"./Base":9}],12:[function(require,module,exports){
'use strict';

var _moduleName = require('./config');

angular.module(_moduleName.moduleName, ['ng']);

},{"./config":1}],13:[function(require,module,exports){
'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _moduleName = require('./config');

var _LiveDelegate = require('./lib/service/delegate/Live');

var _LiveDelegate2 = _interopRequireDefault(_LiveDelegate);

var _NoopDelegate = require('./lib/service/delegate/Noop');

var _NoopDelegate2 = _interopRequireDefault(_NoopDelegate);

var _InterfaceService = require('./lib/service/InterfaceService');

var _InterfaceService2 = _interopRequireDefault(_InterfaceService);

/**
 * @description
 * A service utilizing an underlaying Vert.x Event Bus
 *
 * The advanced features of this service are:
 *  - broadcasting the connection changes (vertx-eventbus.system.connected, vertx-eventbus.system.disconnected) on $rootScope
 *  - registering all handlers again when a reconnect had been required
 *  - supporting a promise when using send()
 *  - adding aliases on (registerHandler), un (unregisterHandler) and emit (publish)
 *
 * Basic usage:
 * module.controller('MyController', function('vertxEventService') {
 *   vertxEventService.on('my.address', function(message) {
 *     console.log("JSON Message received: ", message)
 *   });
 *   vertxEventService.publish('my.other.address', {type: 'foo', data: 'bar'});
 * });
 *
 * Note the additional configuration of the module itself.
 */
angular.module(_moduleName.moduleName).provider('vertxEventBusService', function () {
  var _this = this;

  var DEFAULT_OPTIONS = {
    loginRequired: false
  };

  // options (globally, application-wide)
  var options = angular.extend({}, DEFAULT_OPTIONS);

  this.requireLogin = function () {
    var value = arguments[0] === undefined ? options.loginRequired : arguments[0];

    options.loginRequired = value === true;
    return _this;
  };

  this.$get = ["$rootScope", "$q", "$interval", "vertxEventBus", "$log", function ($rootScope, $q, $interval, vertxEventBus, $log) {
    var instanceOptions = angular.extend({}, vertxEventBus.getOptions(), options);
    if (instanceOptions.enabled) {
      return new _InterfaceService2['default'](new _LiveDelegate2['default']($rootScope, $interval, $log, $q, vertxEventBus, instanceOptions), $log);
    } else {
      return new _InterfaceService2['default'](new _NoopDelegate2['default']());
    }
  }]; // $get
});

},{"./config":1,"./lib/service/InterfaceService":5,"./lib/service/delegate/Live":7,"./lib/service/delegate/Noop":8}],14:[function(require,module,exports){
'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _moduleName = require('./config');

var _EventbusWrapper = require('./lib/wrapper/Eventbus');

var _EventbusWrapper2 = _interopRequireDefault(_EventbusWrapper);

var _NoopWrapper = require('./lib/wrapper/Noop');

var _NoopWrapper2 = _interopRequireDefault(_NoopWrapper);

/**
 * An AngularJS wrapper for projects using the VertX Event Bus
 *
 * @param {boolean} [enabled=true] -  if false, the usage of the Event Bus will
 *                                    be disabled (actually, no vertx.EventBus will be created)
 * @param {boolean} [debugEnabled=false] - if true, some additional debug loggings will be displayed
 * @param {string} [prefix='vertx-eventbus.'] -
 *                                    a prefix used for the global broadcasts
 * @param {string} [urlServer=location.protocol + '//' + location.hostname + ':' + (location.port || 80)] -
 *                                    full URL to the server (change it if the server is not the origin)
 * @param {string} [urlPath='/eventbus'] - path to the event bus
 * @param {boolean} [reconnectEnabled=true] - if false, the disconnect will be recognized but no further actions
 * @param {number} [sockjsStateInterval=10000] - defines the check interval (in ms) of the underlayling SockJS connection
 * @param {number} [sockjsReconnectInterval=10000] - defines the wait time (in ms) for a reconnect after a disconnect has been recognized
 * @param {object} [sockjsOptions={}] - optional SockJS options (new SockJS(url, undefined, options))
 */
angular.module(_moduleName.moduleName).provider('vertxEventBus', function () {
  var _this = this;

  // default options for this module: TODO doc
  var DEFAULT_OPTIONS = {
    enabled: true,
    debugEnabled: false,
    prefix: 'vertx-eventbus.',
    urlServer: '' + location.protocol + '//' + location.hostname + ((function () {
      if (location.port) {
        return ':' + location.port;
      }
    })() || ''),
    urlPath: '/eventbus',
    reconnectEnabled: true,
    sockjsStateInterval: 10000,
    sockjsReconnectInterval: 10000,
    sockjsOptions: {},
    messageBuffer: 0
  };

  // options (globally, application-wide)
  var options = angular.extend({}, DEFAULT_OPTIONS);

  this.enable = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.enabled : arguments[0];

    options.enabled = value === true;
    return _this;
  };

  this.useDebug = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.debugEnabled : arguments[0];

    options.debugEnabled = value === true;
    return _this;
  };

  this.usePrefix = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.prefix : arguments[0];

    options.prefix = value;
    return _this;
  };

  this.useUrlServer = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.urlServer : arguments[0];

    options.urlServer = value;
    return _this;
  };

  this.useUrlPath = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.urlPath : arguments[0];

    options.urlPath = value;
    return _this;
  };

  this.useReconnect = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.reconnectEnabled : arguments[0];

    options.reconnectEnabled = value;
    return _this;
  };

  this.useSockJsStateInterval = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.sockjsStateInterval : arguments[0];

    options.sockjsStateInterval = value;
    return _this;
  };

  this.useSockJsReconnectInterval = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.sockjsReconnectInterval : arguments[0];

    options.sockjsReconnectInterval = value;
    return _this;
  };

  this.useSockJsOptions = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.sockjsOptions : arguments[0];

    options.sockjsOptions = value;
    return _this;
  };

  this.useMessageBuffer = function () {
    var value = arguments[0] === undefined ? DEFAULT_OPTIONS.messageBuffer : arguments[0];

    options.messageBuffer = value;
    return _this;
  };

  /**
   *
   * @description
   * A stub representing the Vert.x EventBus (core functionality)
   *
   * Because the Event Bus cannot handle a reconnect (because of the underlaying SockJS), a
   * new instance of the bus have to be created.
   * This stub ensures only one object holding the current active instance of the bus.
   *
   * The stub supports theses Vert.x Event Bus APIs:
   *  - close()
   *  - login(username, password, replyHandler)
   *  - send(address, message, handler)
   *  - publish(address, message)
   *  - registerHandler(adress, handler)
   *  - unregisterHandler(address, handler)
   *  - readyState()
   *
   * Furthermore, the stub supports theses extra APIs:
   *  - reconnect()
   *
   * @param $timeout
   * @param $log
   */
  this.$get = ["$timeout", "$log", function ($timeout, $log) {

    // Current options (merged defaults with application-wide settings)
    var instanceOptions = angular.extend({}, DEFAULT_OPTIONS, options);

    if (instanceOptions.enabled && vertx && vertx.EventBus) {
      if (instanceOptions.debugEnabled) {
        $log.debug('[Vert.x EB Stub] Enabled');
      }
      return new _EventbusWrapper2['default'](vertx.EventBus, $timeout, $log, instanceOptions);
    } else {
      if (instanceOptions.debugEnabled) {
        $log.debug('[Vert.x EB Stub] Disabled');
      }
      return new _NoopWrapper2['default']();
    }
  }]; // $get
});

},{"./config":1,"./lib/wrapper/Eventbus":10,"./lib/wrapper/Noop":11}]},{},[2]);
