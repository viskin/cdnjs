/**
 * ag-grid - Advanced Data Grid / Data Table supporting Javascript / React / AngularJS / Web Components
 * @version v4.0.3
 * @link http://www.ag-grid.com/
 * @license MIT
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var columnController_1 = require("./columnController/columnController");
var valueService_1 = require("./valueService");
var context_1 = require("./context/context");
var context_2 = require("./context/context");
var gridOptionsWrapper_1 = require("./gridOptionsWrapper");
var LINE_SEPARATOR = '\r\n';
var CsvCreator = (function () {
    function CsvCreator() {
    }
    CsvCreator.prototype.exportDataAsCsv = function (params) {
        var csvString = this.getDataAsCsv(params);
        var fileNamePresent = params && params.fileName && params.fileName.length !== 0;
        var fileName = fileNamePresent ? params.fileName : 'export.csv';
        // for Excel, we need \ufeff at the start
        // http://stackoverflow.com/questions/17879198/adding-utf-8-bom-to-string-blob
        var blobObject = new Blob(["\ufeff", csvString], {
            type: "text/csv;charset=utf-8;"
        });
        // Internet Explorer
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blobObject, fileName);
        }
        else {
            // Chrome
            var downloadLink = document.createElement("a");
            downloadLink.href = window.URL.createObjectURL(blobObject);
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };
    CsvCreator.prototype.getDataAsCsv = function (params) {
        var _this = this;
        if (this.gridOptionsWrapper.isRowModelVirtual()) {
            console.log('ag-Grid: getDataAsCsv not available when doing virtual pagination');
            return '';
        }
        var result = '';
        var skipGroups = params && params.skipGroups;
        var skipHeader = params && params.skipHeader;
        var skipFooters = params && params.skipFooters;
        var includeCustomHeader = params && params.customHeader;
        var includeCustomFooter = params && params.customFooter;
        var allColumns = params && params.allColumns;
        var onlySelected = params && params.onlySelected;
        var columnSeparator = (params && params.columnSeparator) || ',';
        var processCellCallback = params.processCellCallback;
        var columnsToExport;
        if (allColumns) {
            columnsToExport = this.columnController.getAllColumns();
        }
        else {
            columnsToExport = this.columnController.getAllDisplayedColumns();
        }
        if (!columnsToExport || columnsToExport.length === 0) {
            return '';
        }
        if (includeCustomHeader) {
            result += params.customHeader;
        }
        // first pass, put in the header names of the cols
        if (!skipHeader) {
            columnsToExport.forEach(function (column, index) {
                var nameForCol = _this.columnController.getDisplayNameForCol(column);
                if (nameForCol === null || nameForCol === undefined) {
                    nameForCol = '';
                }
                if (index != 0) {
                    result += columnSeparator;
                }
                result += '"' + _this.escape(nameForCol) + '"';
            });
            result += LINE_SEPARATOR;
        }
        this.rowModel.forEachNodeAfterFilterAndSort(function (node) {
            if (skipGroups && node.group) {
                return;
            }
            if (skipFooters && node.footer) {
                return;
            }
            if (onlySelected && !node.isSelected()) {
                return;
            }
            columnsToExport.forEach(function (column, index) {
                var valueForCell;
                if (node.group && index === 0) {
                    valueForCell = _this.createValueForGroupNode(node);
                }
                else {
                    valueForCell = _this.valueService.getValue(column, node);
                }
                valueForCell = _this.processCell(node, column, valueForCell, processCellCallback);
                if (valueForCell === null || valueForCell === undefined) {
                    valueForCell = '';
                }
                if (index != 0) {
                    result += columnSeparator;
                }
                result += '"' + _this.escape(valueForCell) + '"';
            });
            result += LINE_SEPARATOR;
        });
        if (includeCustomFooter) {
            result += params.customFooter;
        }
        return result;
    };
    CsvCreator.prototype.processCell = function (rowNode, column, value, processCellCallback) {
        if (processCellCallback) {
            return processCellCallback({
                column: column,
                node: rowNode,
                value: value,
                api: this.gridOptionsWrapper.getApi(),
                columnApi: this.gridOptionsWrapper.getColumnApi(),
                context: this.gridOptionsWrapper.getContext()
            });
        }
        else {
            return value;
        }
    };
    CsvCreator.prototype.createValueForGroupNode = function (node) {
        var keys = [node.key];
        while (node.parent) {
            node = node.parent;
            keys.push(node.key);
        }
        return keys.reverse().join(' -> ');
    };
    // replace each " with "" (ie two sets of double quotes is how to do double quotes in csv)
    CsvCreator.prototype.escape = function (value) {
        if (value === null || value === undefined) {
            return '';
        }
        var stringValue;
        if (typeof value === 'string') {
            stringValue = value;
        }
        else if (typeof value.toString === 'function') {
            stringValue = value.toString();
        }
        else {
            console.warn('known value type during csv conversion');
            stringValue = '';
        }
        return stringValue.replace(/"/g, "\"\"");
    };
    __decorate([
        context_2.Autowired('rowModel'), 
        __metadata('design:type', Object)
    ], CsvCreator.prototype, "rowModel", void 0);
    __decorate([
        context_2.Autowired('columnController'), 
        __metadata('design:type', columnController_1.ColumnController)
    ], CsvCreator.prototype, "columnController", void 0);
    __decorate([
        context_2.Autowired('valueService'), 
        __metadata('design:type', valueService_1.ValueService)
    ], CsvCreator.prototype, "valueService", void 0);
    __decorate([
        context_2.Autowired('gridOptionsWrapper'), 
        __metadata('design:type', gridOptionsWrapper_1.GridOptionsWrapper)
    ], CsvCreator.prototype, "gridOptionsWrapper", void 0);
    CsvCreator = __decorate([
        context_1.Bean('csvCreator'), 
        __metadata('design:paramtypes', [])
    ], CsvCreator);
    return CsvCreator;
})();
exports.CsvCreator = CsvCreator;
