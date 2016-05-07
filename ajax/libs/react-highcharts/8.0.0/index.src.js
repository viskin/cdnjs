(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react"), require("highcharts"));
	else if(typeof define === 'function' && define.amd)
		define(["react", "highcharts"], factory);
	else if(typeof exports === 'object')
		exports["index"] = factory(require("react"), require("highcharts"));
	else
		root["index"] = factory(root["React"], root["Highcharts"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(2)('Chart', __webpack_require__(4));

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var React = __webpack_require__(3);

	module.exports = function (chartType, Highcharts) {
	  var displayName = 'Highcharts' + chartType;
	  var result = React.createClass({
	    displayName: displayName,

	    propTypes: {
	      config: React.PropTypes.object.isRequired,
	      isPureConfig: React.PropTypes.bool
	    },

	    renderChart: function renderChart(config) {
	      if (!config) {
	        throw new Error('Config must be specified for the ' + displayName + ' component');
	      }
	      var chartConfig = config.chart;
	      this.chart = new Highcharts[chartType](_extends({}, config, {
	        chart: _extends({}, chartConfig, {
	          renderTo: this.refs.chart
	        })
	      }));
	    },

	    shouldComponentUpdate: function shouldComponentUpdate(nextProps) {
	      if (!this.props.isPureConfig || !(this.props.config === nextProps.config)) {
	        this.renderChart(nextProps.config);
	      }
	      return true;
	    },


	    getChart: function getChart() {
	      if (!this.chart) {
	        throw new Error('getChart() should not be called before the component is mounted');
	      }
	      return this.chart;
	    },

	    componentDidMount: function componentDidMount() {
	      this.renderChart(this.props.config);
	    },

	    render: function render() {
	      var props = this.props;
	      props = _extends({}, props, {
	        ref: 'chart'
	      });
	      return React.createElement('div', props);
	    }
	  });

	  result.Highcharts = Highcharts;
	  return result;
	};

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_4__;

/***/ }
/******/ ])
});
;