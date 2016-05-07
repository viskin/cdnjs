/**
 * API Bound Models for AngularJS
 * @version v0.7.1 - 2013-11-19
 * @link https://github.com/angular-platanus/restmod
 * @author Ignacio Baixas <iobaixas@gmai.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

(function(angular, undefined) {
'use strict';
/**
 * @mixin DirtyModel
 *
 * @description Adds the `$dirty` method to a model`s instances.
 */

angular.module('plRestmod').factory('DirtyModel', ['$restmod', 'SyncMask', function($restmod, SyncMask) {

  return $restmod.mixin(function() {
    this.attrMask('$cmStatus', SyncMask.SYSTEM_ALL) // make special property ignored and system like
        .on('after-feed', function(_original) {
          // store original information in a model's special property
          var original = this.$cmStatus = {};
          this.$each(function(_value, _key) {
            original[_key] = _value;
          });
        })
        /**
         * @method $dirty
         * @memberof DirtyModel#
         *
         * @description Retrieves the model changes
         *
         * Property changes are determined using the strict equality operator.
         *
         * IDEA: allow changing the equality function per attribute.
         *
         * If given a property name, this method will return true if property has changed
         * or false if it has not.
         *
         * Called without arguments, this method will return a list of changed property names.
         *
         * @param {string} _prop Property to query
         * @return {boolean|array} Property state or array of changed properties
         */
        .define('$dirty', function(_prop) {
          var original = this.$cmStatus;
          if(_prop) {
            if(!original || original[_prop] === undefined) return false;
            return original[_prop] !== this[_prop];
          } else {
            var changes = [], key;
            if(original) {
              for(key in original) {
                if(original.hasOwnProperty(key) && original[key] !== this[key]) {
                  changes.push(key);
                }
              }
            }
            return changes;
          }
        });
  });
}]);})(angular);