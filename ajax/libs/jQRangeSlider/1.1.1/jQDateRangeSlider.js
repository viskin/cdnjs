/* jQRangeSlider
 * A javascript slider selector that supports dates
 * 
 * Copyright (C) Guillaume Gautreau 2010
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function ($, undefined) {
	$.widget("ui.dateRangeSlider", $.extend({}, $.ui.rangeSlider.prototype, {
		_create: function(){
			if (this.options.bounds != null && this.options.bounds.min instanceof Date && this.options.bounds.max instanceof Date){
				this.options.bounds = {min: this.options.bounds.min.valueOf(), max: this.options.bounds.max.valueOf()};
			}else{
				this.options.bounds = {min: new Date(2010,0,1).valueOf(), max: new Date(2012,0,1).valueOf()};
			}
			
			if (this.options.defaultValues != null && this.options.defaultValues.min instanceof Date && this.options.defaultValues.max instanceof Date){
				this.options.defaultValues = {min: this.options.defaultValues.min.valueOf(), max: this.options.defaultValues.max.valueOf()};
			}else{
				this.options.defaultValues = {min: new Date(2010,1,11).valueOf(), max: new Date(2011,1,11).valueOf()};
			}
			
			
			$.ui.rangeSlider.prototype._create.apply(this, arguments);
		},
	
		_setOption: function(key, value){
			if ((key == "defaultValues" || key== "bounds") && typeof value != "undefined" && value != null && typeof value.min != "undefined" && typeof value.max != undefined){
				if (value.min instanceof Date && value.max instanceof Date){
					$.ui.rangeSlider.prototype._setOption.apply(this, [key, {min:value.min.valueOf(), max:value.max.valueOf()}]);
				}
			}else{
				$.ui.rangeSlider.prototype._setOption.apply(this, arguments);
			}
		},
		
		values: function(min, max){
			if (typeof min != "undefined" && typeof max != "undefined" && min instanceof Date && max instanceof Date)
			{
				values = $.ui.rangeSlider.prototype.values.apply(this, [min.valueOf(), max.valueOf()]);
			}else{
				values = $.ui.rangeSlider.prototype.values.apply(this, arguments);
			}
			
			return {min: new Date(values.min), max: new Date(values.max)};
		},
		
		min: function(min){
			if (typeof min != "undefined" && min instanceof Date){
				return new Date($.ui.rangeSlider.prototype.min.apply(this, [min.valueOf()]));
			}
			
			return new Date($.ui.rangeSlider.prototype.min.apply(this));
		},
		
		max: function(max){
			if (typeof max != "undefined" && max instanceof Date){
				return new Date($.ui.rangeSlider.prototype.max.apply(this, [max.valueOf()]));
			}
			
			return new Date($.ui.rangeSlider.prototype.max.apply(this));
		}
		
	}));
})(jQuery);