/**
 * ag-grid - Advanced Data Grid / Data Table supporting Javascript / React / AngularJS / Web Components
 * @version v4.1.4
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
var csvCreator_1 = require("./csvCreator");
var rowRenderer_1 = require("./rendering/rowRenderer");
var headerRenderer_1 = require("./headerRendering/headerRenderer");
var filterManager_1 = require("./filter/filterManager");
var columnController_1 = require("./columnController/columnController");
var selectionController_1 = require("./selectionController");
var gridOptionsWrapper_1 = require("./gridOptionsWrapper");
var gridPanel_1 = require("./gridPanel/gridPanel");
var valueService_1 = require("./valueService");
var masterSlaveService_1 = require("./masterSlaveService");
var eventService_1 = require("./eventService");
var floatingRowModel_1 = require("./rowControllers/floatingRowModel");
var constants_1 = require("./constants");
var context_1 = require("./context/context");
var gridCore_1 = require("./gridCore");
var sortController_1 = require("./sortController");
var paginationController_1 = require("./rowControllers/paginationController");
var focusedCellController_1 = require("./focusedCellController");
var utils_1 = require("./utils");
var cellRendererFactory_1 = require("./rendering/cellRendererFactory");
var cellEditorFactory_1 = require("./rendering/cellEditorFactory");
var GridApi = (function () {
    function GridApi() {
    }
    GridApi.prototype.init = function () {
        if (this.rowModel.getType() === constants_1.Constants.ROW_MODEL_TYPE_NORMAL) {
            this.inMemoryRowModel = this.rowModel;
        }
    };
    /** Used internally by grid. Not intended to be used by the client. Interface may change between releases. */
    GridApi.prototype.__getMasterSlaveService = function () {
        return this.masterSlaveService;
    };
    GridApi.prototype.getFirstRenderedRow = function () {
        return this.rowRenderer.getFirstVirtualRenderedRow();
    };
    GridApi.prototype.getLastRenderedRow = function () {
        return this.rowRenderer.getLastVirtualRenderedRow();
    };
    GridApi.prototype.getDataAsCsv = function (params) {
        return this.csvCreator.getDataAsCsv(params);
    };
    GridApi.prototype.exportDataAsCsv = function (params) {
        this.csvCreator.exportDataAsCsv(params);
    };
    GridApi.prototype.setDatasource = function (datasource) {
        if (this.gridOptionsWrapper.isRowModelPagination()) {
            this.paginationController.setDatasource(datasource);
        }
        else if (this.gridOptionsWrapper.isRowModelVirtual()) {
            this.rowModel.setDatasource(datasource);
        }
        else {
            console.warn("ag-Grid: you can only use a datasource when gridOptions.rowModelType is '" + constants_1.Constants.ROW_MODEL_TYPE_VIRTUAL + "' or '" + constants_1.Constants.ROW_MODEL_TYPE_PAGINATION + "'");
        }
    };
    GridApi.prototype.setViewportDatasource = function (viewportDatasource) {
        if (this.gridOptionsWrapper.isRowModelViewport()) {
            // this is bad coding, because it's using an interface that's exposed in the enterprise.
            // really we should create an interface in the core for viewportDatasource and let
            // the enterprise implement it, rather than casting to 'any' here
            this.rowModel.setViewportDatasource(viewportDatasource);
        }
        else {
            console.warn("ag-Grid: you can only use a datasource when gridOptions.rowModelType is '" + constants_1.Constants.ROW_MODEL_TYPE_VIEWPORT + "'");
        }
    };
    GridApi.prototype.setRowData = function (rowData) {
        if (utils_1.Utils.missing(this.inMemoryRowModel)) {
            console.log('cannot call setRowData unless using normal row model');
        }
        this.inMemoryRowModel.setRowData(rowData, true);
    };
    GridApi.prototype.setFloatingTopRowData = function (rows) {
        this.floatingRowModel.setFloatingTopRowData(rows);
    };
    GridApi.prototype.setFloatingBottomRowData = function (rows) {
        this.floatingRowModel.setFloatingBottomRowData(rows);
    };
    GridApi.prototype.setColumnDefs = function (colDefs) {
        this.columnController.setColumnDefs(colDefs);
    };
    GridApi.prototype.refreshRows = function (rowNodes) {
        this.rowRenderer.refreshRows(rowNodes);
    };
    GridApi.prototype.refreshCells = function (rowNodes, colIds, animate) {
        if (animate === void 0) { animate = false; }
        this.rowRenderer.refreshCells(rowNodes, colIds, animate);
    };
    GridApi.prototype.rowDataChanged = function (rows) {
        this.rowRenderer.rowDataChanged(rows);
    };
    GridApi.prototype.refreshView = function () {
        this.rowRenderer.refreshView();
    };
    GridApi.prototype.softRefreshView = function () {
        this.rowRenderer.softRefreshView();
    };
    GridApi.prototype.refreshGroupRows = function () {
        this.rowRenderer.refreshGroupRows();
    };
    GridApi.prototype.refreshHeader = function () {
        // need to review this - the refreshHeader should also refresh all icons in the header
        this.headerRenderer.refreshHeader();
    };
    GridApi.prototype.isAnyFilterPresent = function () {
        return this.filterManager.isAnyFilterPresent();
    };
    GridApi.prototype.isAdvancedFilterPresent = function () {
        return this.filterManager.isAdvancedFilterPresent();
    };
    GridApi.prototype.isQuickFilterPresent = function () {
        return this.filterManager.isQuickFilterPresent();
    };
    GridApi.prototype.getModel = function () {
        return this.rowModel;
    };
    GridApi.prototype.onGroupExpandedOrCollapsed = function (refreshFromIndex) {
        if (utils_1.Utils.missing(this.inMemoryRowModel)) {
            console.log('cannot call onGroupExpandedOrCollapsed unless using normal row model');
        }
        this.inMemoryRowModel.refreshModel(constants_1.Constants.STEP_MAP, refreshFromIndex);
    };
    GridApi.prototype.expandAll = function () {
        if (utils_1.Utils.missing(this.inMemoryRowModel)) {
            console.log('cannot call expandAll unless using normal row model');
        }
        this.inMemoryRowModel.expandOrCollapseAll(true);
    };
    GridApi.prototype.collapseAll = function () {
        if (utils_1.Utils.missing(this.inMemoryRowModel)) {
            console.log('cannot call collapseAll unless using normal row model');
        }
        this.inMemoryRowModel.expandOrCollapseAll(false);
    };
    GridApi.prototype.addVirtualRowListener = function (eventName, rowIndex, callback) {
        if (typeof eventName !== 'string') {
            console.log('ag-Grid: addVirtualRowListener is deprecated, please use addRenderedRowListener.');
        }
        this.addRenderedRowListener(eventName, rowIndex, callback);
    };
    GridApi.prototype.addRenderedRowListener = function (eventName, rowIndex, callback) {
        if (eventName === 'virtualRowRemoved') {
            console.log('ag-Grid: event virtualRowRemoved is deprecated, now called renderedRowRemoved');
            eventName = '' +
                '';
        }
        if (eventName === 'virtualRowSelected') {
            console.log('ag-Grid: event virtualRowSelected is deprecated, to register for individual row ' +
                'selection events, add a listener directly to the row node.');
        }
        this.rowRenderer.addRenderedRowListener(eventName, rowIndex, callback);
    };
    GridApi.prototype.setQuickFilter = function (newFilter) {
        this.filterManager.setQuickFilter(newFilter);
    };
    GridApi.prototype.selectIndex = function (index, tryMulti, suppressEvents) {
        console.log('ag-Grid: do not use api for selection, call node.setSelected(value) instead');
        this.selectionController.selectIndex(index, tryMulti, suppressEvents);
    };
    GridApi.prototype.deselectIndex = function (index, suppressEvents) {
        if (suppressEvents === void 0) { suppressEvents = false; }
        console.log('ag-Grid: do not use api for selection, call node.setSelected(value) instead');
        this.selectionController.deselectIndex(index, suppressEvents);
    };
    GridApi.prototype.selectNode = function (node, tryMulti, suppressEvents) {
        if (tryMulti === void 0) { tryMulti = false; }
        if (suppressEvents === void 0) { suppressEvents = false; }
        console.log('ag-Grid: API for selection is deprecated, call node.setSelected(value) instead');
        node.setSelected(true, !tryMulti, suppressEvents);
    };
    GridApi.prototype.deselectNode = function (node, suppressEvents) {
        if (suppressEvents === void 0) { suppressEvents = false; }
        console.log('ag-Grid: API for selection is deprecated, call node.setSelected(value) instead');
        node.setSelected(false, false, suppressEvents);
    };
    GridApi.prototype.selectAll = function () {
        this.selectionController.selectAllRowNodes();
    };
    GridApi.prototype.deselectAll = function () {
        this.selectionController.deselectAllRowNodes();
    };
    GridApi.prototype.recomputeAggregates = function () {
        if (utils_1.Utils.missing(this.inMemoryRowModel)) {
            console.log('cannot call recomputeAggregates unless using normal row model');
        }
        this.inMemoryRowModel.refreshModel(constants_1.Constants.STEP_AGGREGATE);
    };
    GridApi.prototype.sizeColumnsToFit = function () {
        if (this.gridOptionsWrapper.isForPrint()) {
            console.warn('ag-grid: sizeColumnsToFit does not work when forPrint=true');
            return;
        }
        this.gridPanel.sizeColumnsToFit();
    };
    GridApi.prototype.showLoadingOverlay = function () {
        this.gridPanel.showLoadingOverlay();
    };
    GridApi.prototype.showNoRowsOverlay = function () {
        this.gridPanel.showNoRowsOverlay();
    };
    GridApi.prototype.hideOverlay = function () {
        this.gridPanel.hideOverlay();
    };
    GridApi.prototype.isNodeSelected = function (node) {
        console.log('ag-Grid: no need to call api.isNodeSelected(), just call node.isSelected() instead');
        return node.isSelected();
    };
    GridApi.prototype.getSelectedNodesById = function () {
        console.error('ag-Grid: since version 3.4, getSelectedNodesById no longer exists, use getSelectedNodes() instead');
        return null;
    };
    GridApi.prototype.getSelectedNodes = function () {
        return this.selectionController.getSelectedNodes();
    };
    GridApi.prototype.getSelectedRows = function () {
        return this.selectionController.getSelectedRows();
    };
    GridApi.prototype.getBestCostNodeSelection = function () {
        return this.selectionController.getBestCostNodeSelection();
    };
    GridApi.prototype.getRenderedNodes = function () {
        return this.rowRenderer.getRenderedNodes();
    };
    GridApi.prototype.ensureColIndexVisible = function (index) {
        console.warn('ag-Grid: ensureColIndexVisible(index) no longer supported, use ensureColumnVisible(colKey) instead.');
    };
    GridApi.prototype.ensureColumnVisible = function (key) {
        this.gridPanel.ensureColumnVisible(key);
    };
    GridApi.prototype.ensureIndexVisible = function (index) {
        this.gridPanel.ensureIndexVisible(index);
    };
    GridApi.prototype.ensureNodeVisible = function (comparator) {
        this.gridCore.ensureNodeVisible(comparator);
    };
    GridApi.prototype.forEachNode = function (callback) {
        this.rowModel.forEachNode(callback);
    };
    GridApi.prototype.forEachNodeAfterFilter = function (callback) {
        if (utils_1.Utils.missing(this.inMemoryRowModel)) {
            console.log('cannot call forEachNodeAfterFilter unless using normal row model');
        }
        this.inMemoryRowModel.forEachNodeAfterFilter(callback);
    };
    GridApi.prototype.forEachNodeAfterFilterAndSort = function (callback) {
        if (utils_1.Utils.missing(this.inMemoryRowModel)) {
            console.log('cannot call forEachNodeAfterFilterAndSort unless using normal row model');
        }
        this.inMemoryRowModel.forEachNodeAfterFilterAndSort(callback);
    };
    GridApi.prototype.getFilterApiForColDef = function (colDef) {
        console.warn('ag-grid API method getFilterApiForColDef deprecated, use getFilterApi instead');
        return this.getFilterApi(colDef);
    };
    GridApi.prototype.getFilterApi = function (key) {
        var column = this.columnController.getColumn(key);
        if (column) {
            return this.filterManager.getFilterApi(column);
        }
    };
    GridApi.prototype.destroyFilter = function (key) {
        var column = this.columnController.getColumn(key);
        if (column) {
            return this.filterManager.destroyFilter(column);
        }
    };
    GridApi.prototype.getColumnDef = function (key) {
        var column = this.columnController.getColumn(key);
        if (column) {
            return column.getColDef();
        }
        else {
            return null;
        }
    };
    GridApi.prototype.onFilterChanged = function () {
        this.filterManager.onFilterChanged();
    };
    GridApi.prototype.setSortModel = function (sortModel) {
        this.sortController.setSortModel(sortModel);
    };
    GridApi.prototype.getSortModel = function () {
        return this.sortController.getSortModel();
    };
    GridApi.prototype.setFilterModel = function (model) {
        this.filterManager.setFilterModel(model);
    };
    GridApi.prototype.getFilterModel = function () {
        return this.filterManager.getFilterModel();
    };
    GridApi.prototype.getFocusedCell = function () {
        return this.focusedCellController.getFocusedCell();
    };
    GridApi.prototype.setFocusedCell = function (rowIndex, colKey, floating) {
        this.focusedCellController.setFocusedCell(rowIndex, colKey, floating, true);
    };
    GridApi.prototype.setHeaderHeight = function (headerHeight) {
        this.gridOptionsWrapper.setHeaderHeight(headerHeight);
    };
    GridApi.prototype.showToolPanel = function (show) {
        this.gridCore.showToolPanel(show);
    };
    GridApi.prototype.isToolPanelShowing = function () {
        return this.gridCore.isToolPanelShowing();
    };
    GridApi.prototype.doLayout = function () {
        this.gridCore.doLayout();
    };
    GridApi.prototype.getValue = function (colKey, rowNode) {
        var column = this.columnController.getColumn(colKey);
        return this.valueService.getValue(column, rowNode);
    };
    GridApi.prototype.addEventListener = function (eventType, listener) {
        this.eventService.addEventListener(eventType, listener);
    };
    GridApi.prototype.addGlobalListener = function (listener) {
        this.eventService.addGlobalListener(listener);
    };
    GridApi.prototype.removeEventListener = function (eventType, listener) {
        this.eventService.removeEventListener(eventType, listener);
    };
    GridApi.prototype.removeGlobalListener = function (listener) {
        this.eventService.removeGlobalListener(listener);
    };
    GridApi.prototype.dispatchEvent = function (eventType, event) {
        this.eventService.dispatchEvent(eventType, event);
    };
    GridApi.prototype.destroy = function () {
        this.context.destroy();
    };
    GridApi.prototype.resetQuickFilter = function () {
        this.rowModel.forEachNode(function (node) { return node.quickFilterAggregateText = null; });
    };
    GridApi.prototype.getRangeSelections = function () {
        if (this.rangeController) {
            return this.rangeController.getCellRanges();
        }
        else {
            console.warn('ag-Grid: cell range selection is only available in ag-Grid Enterprise');
            return null;
        }
    };
    GridApi.prototype.addRangeSelection = function (rangeSelection) {
        if (!this.rangeController) {
            console.warn('ag-Grid: cell range selection is only available in ag-Grid Enterprise');
        }
        this.rangeController.addRange(rangeSelection);
    };
    GridApi.prototype.clearRangeSelection = function () {
        if (!this.rangeController) {
            console.warn('ag-Grid: cell range selection is only available in ag-Grid Enterprise');
        }
        this.rangeController.clearSelection();
    };
    GridApi.prototype.copySelectedRowsToClipboard = function () {
        if (!this.clipboardService) {
            console.warn('ag-Grid: clipboard is only available in ag-Grid Enterprise');
        }
        this.clipboardService.copySelectedRowsToClipboard();
    };
    GridApi.prototype.copySelectedRangeToClipboard = function () {
        if (!this.clipboardService) {
            console.warn('ag-Grid: clipboard is only available in ag-Grid Enterprise');
        }
        this.clipboardService.copySelectedRangeToClipboard();
    };
    GridApi.prototype.copySelectedRangeDown = function () {
        if (!this.clipboardService) {
            console.warn('ag-Grid: clipboard is only available in ag-Grid Enterprise');
        }
        this.clipboardService.copyRangeDown();
    };
    GridApi.prototype.showColumnMenuAfterButtonClick = function (colKey, buttonElement) {
        var column = this.columnController.getColumn(colKey);
        this.menuFactory.showMenuAfterButtonClick(column, buttonElement);
    };
    GridApi.prototype.showColumnMenuAfterMouseClick = function (colKey, mouseEvent) {
        var column = this.columnController.getColumn(colKey);
        this.menuFactory.showMenuAfterMouseEvent(column, mouseEvent);
    };
    __decorate([
        context_1.Autowired('csvCreator'), 
        __metadata('design:type', csvCreator_1.CsvCreator)
    ], GridApi.prototype, "csvCreator", void 0);
    __decorate([
        context_1.Autowired('gridCore'), 
        __metadata('design:type', gridCore_1.GridCore)
    ], GridApi.prototype, "gridCore", void 0);
    __decorate([
        context_1.Autowired('rowRenderer'), 
        __metadata('design:type', rowRenderer_1.RowRenderer)
    ], GridApi.prototype, "rowRenderer", void 0);
    __decorate([
        context_1.Autowired('headerRenderer'), 
        __metadata('design:type', headerRenderer_1.HeaderRenderer)
    ], GridApi.prototype, "headerRenderer", void 0);
    __decorate([
        context_1.Autowired('filterManager'), 
        __metadata('design:type', filterManager_1.FilterManager)
    ], GridApi.prototype, "filterManager", void 0);
    __decorate([
        context_1.Autowired('columnController'), 
        __metadata('design:type', columnController_1.ColumnController)
    ], GridApi.prototype, "columnController", void 0);
    __decorate([
        context_1.Autowired('selectionController'), 
        __metadata('design:type', selectionController_1.SelectionController)
    ], GridApi.prototype, "selectionController", void 0);
    __decorate([
        context_1.Autowired('gridOptionsWrapper'), 
        __metadata('design:type', gridOptionsWrapper_1.GridOptionsWrapper)
    ], GridApi.prototype, "gridOptionsWrapper", void 0);
    __decorate([
        context_1.Autowired('gridPanel'), 
        __metadata('design:type', gridPanel_1.GridPanel)
    ], GridApi.prototype, "gridPanel", void 0);
    __decorate([
        context_1.Autowired('valueService'), 
        __metadata('design:type', valueService_1.ValueService)
    ], GridApi.prototype, "valueService", void 0);
    __decorate([
        context_1.Autowired('masterSlaveService'), 
        __metadata('design:type', masterSlaveService_1.MasterSlaveService)
    ], GridApi.prototype, "masterSlaveService", void 0);
    __decorate([
        context_1.Autowired('eventService'), 
        __metadata('design:type', eventService_1.EventService)
    ], GridApi.prototype, "eventService", void 0);
    __decorate([
        context_1.Autowired('floatingRowModel'), 
        __metadata('design:type', floatingRowModel_1.FloatingRowModel)
    ], GridApi.prototype, "floatingRowModel", void 0);
    __decorate([
        context_1.Autowired('context'), 
        __metadata('design:type', context_1.Context)
    ], GridApi.prototype, "context", void 0);
    __decorate([
        context_1.Autowired('rowModel'), 
        __metadata('design:type', Object)
    ], GridApi.prototype, "rowModel", void 0);
    __decorate([
        context_1.Autowired('sortController'), 
        __metadata('design:type', sortController_1.SortController)
    ], GridApi.prototype, "sortController", void 0);
    __decorate([
        context_1.Autowired('paginationController'), 
        __metadata('design:type', paginationController_1.PaginationController)
    ], GridApi.prototype, "paginationController", void 0);
    __decorate([
        context_1.Autowired('focusedCellController'), 
        __metadata('design:type', focusedCellController_1.FocusedCellController)
    ], GridApi.prototype, "focusedCellController", void 0);
    __decorate([
        context_1.Optional('rangeController'), 
        __metadata('design:type', Object)
    ], GridApi.prototype, "rangeController", void 0);
    __decorate([
        context_1.Optional('clipboardService'), 
        __metadata('design:type', Object)
    ], GridApi.prototype, "clipboardService", void 0);
    __decorate([
        context_1.Autowired('menuFactory'), 
        __metadata('design:type', Object)
    ], GridApi.prototype, "menuFactory", void 0);
    __decorate([
        context_1.Autowired('cellRendererFactory'), 
        __metadata('design:type', cellRendererFactory_1.CellRendererFactory)
    ], GridApi.prototype, "cellRendererFactory", void 0);
    __decorate([
        context_1.Autowired('cellEditorFactory'), 
        __metadata('design:type', cellEditorFactory_1.CellEditorFactory)
    ], GridApi.prototype, "cellEditorFactory", void 0);
    __decorate([
        context_1.PostConstruct, 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], GridApi.prototype, "init", null);
    GridApi = __decorate([
        context_1.Bean('gridApi'), 
        __metadata('design:paramtypes', [])
    ], GridApi);
    return GridApi;
})();
exports.GridApi = GridApi;
