/**
 * ag-grid - Advanced Data Grid / Data Table supporting Javascript / React / AngularJS / Web Components
 * @version v4.1.0
 * @link http://www.ag-grid.com/
 * @license MIT
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var utils_1 = require("../utils");
var column_1 = require("../entities/column");
var rowNode_1 = require("../entities/rowNode");
var gridOptionsWrapper_1 = require("../gridOptionsWrapper");
var expressionService_1 = require("../expressionService");
var selectionRendererFactory_1 = require("../selectionRendererFactory");
var rowRenderer_1 = require("./rowRenderer");
var templateService_1 = require("../templateService");
var columnController_1 = require("../columnController/columnController");
var valueService_1 = require("../valueService");
var eventService_1 = require("../eventService");
var constants_1 = require("../constants");
var events_1 = require("../events");
var context_1 = require("../context/context");
var gridApi_1 = require("../gridApi");
var focusedCellController_1 = require("../focusedCellController");
var gridCell_1 = require("../entities/gridCell");
var focusService_1 = require("../misc/focusService");
var cellEditorFactory_1 = require("./cellEditorFactory");
var component_1 = require("../widgets/component");
var popupService_1 = require("../widgets/popupService");
var cellRendererFactory_1 = require("./cellRendererFactory");
var cellRendererService_1 = require("./cellRendererService");
var valueFormatterService_1 = require("./valueFormatterService");
var RenderedCell = (function (_super) {
    __extends(RenderedCell, _super);
    function RenderedCell(column, node, rowIndex, scope, renderedRow) {
        _super.call(this, '<div/>');
        this.firstRightPinned = false;
        this.lastLeftPinned = false;
        // because we reference eGridCell everywhere in this class,
        // we keep a local reference
        this.eGridCell = this.getGui();
        this.column = column;
        this.node = node;
        this.rowIndex = rowIndex;
        this.scope = scope;
        this.renderedRow = renderedRow;
        this.gridCell = new gridCell_1.GridCell(rowIndex, node.floating, column);
    }
    RenderedCell.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        if (this.cellEditor && this.cellEditor.destroy) {
            this.cellEditor.destroy();
        }
        if (this.cellRenderer && this.cellRenderer.destroy) {
            this.cellRenderer.destroy();
        }
    };
    RenderedCell.prototype.setPinnedClasses = function () {
        var _this = this;
        var firstPinnedChangedListener = function () {
            if (_this.firstRightPinned !== _this.column.isFirstRightPinned()) {
                _this.firstRightPinned = _this.column.isFirstRightPinned();
                utils_1.Utils.addOrRemoveCssClass(_this.eGridCell, 'ag-cell-first-right-pinned', _this.firstRightPinned);
            }
            if (_this.lastLeftPinned !== _this.column.isLastLeftPinned()) {
                _this.lastLeftPinned = _this.column.isLastLeftPinned();
                utils_1.Utils.addOrRemoveCssClass(_this.eGridCell, 'ag-cell-last-left-pinned', _this.lastLeftPinned);
            }
        };
        this.column.addEventListener(column_1.Column.EVENT_FIRST_RIGHT_PINNED_CHANGED, firstPinnedChangedListener);
        this.column.addEventListener(column_1.Column.EVENT_LAST_LEFT_PINNED_CHANGED, firstPinnedChangedListener);
        this.addDestroyFunc(function () {
            _this.column.removeEventListener(column_1.Column.EVENT_FIRST_RIGHT_PINNED_CHANGED, firstPinnedChangedListener);
            _this.column.removeEventListener(column_1.Column.EVENT_LAST_LEFT_PINNED_CHANGED, firstPinnedChangedListener);
        });
        firstPinnedChangedListener();
    };
    RenderedCell.prototype.getParentRow = function () {
        return this.eParentRow;
    };
    RenderedCell.prototype.setParentRow = function (eParentRow) {
        this.eParentRow = eParentRow;
    };
    RenderedCell.prototype.calculateCheckboxSelection = function () {
        // never allow selection on floating rows
        if (this.node.floating) {
            return false;
        }
        // if boolean set, then just use it
        var colDef = this.column.getColDef();
        if (typeof colDef.checkboxSelection === 'boolean') {
            return colDef.checkboxSelection;
        }
        // if function, then call the function to find out. we first check colDef for
        // a function, and if missing then check gridOptions, so colDef has precedence
        var selectionFunc;
        if (typeof colDef.checkboxSelection === 'function') {
            selectionFunc = colDef.checkboxSelection;
        }
        if (!selectionFunc && this.gridOptionsWrapper.getCheckboxSelection()) {
            selectionFunc = this.gridOptionsWrapper.getCheckboxSelection();
        }
        if (selectionFunc) {
            var params = this.createParams();
            return selectionFunc(params);
        }
        return false;
    };
    RenderedCell.prototype.getColumn = function () {
        return this.column;
    };
    RenderedCell.prototype.getValue = function () {
        var data = this.getDataForRow();
        return this.valueService.getValueUsingSpecificData(this.column, data, this.node);
    };
    RenderedCell.prototype.getDataForRow = function () {
        if (this.node.footer) {
            // if footer, we always show the data
            return this.node.data;
        }
        else if (this.node.group) {
            // if header and header is expanded, we show data in footer only
            var footersEnabled = this.gridOptionsWrapper.isGroupIncludeFooter();
            var suppressHideHeader = this.gridOptionsWrapper.isGroupSuppressBlankHeader();
            if (this.node.expanded && footersEnabled && !suppressHideHeader) {
                return undefined;
            }
            else {
                return this.node.data;
            }
        }
        else {
            // otherwise it's a normal node, just return data as normal
            return this.node.data;
        }
    };
    RenderedCell.prototype.setLeftOnCell = function () {
        var _this = this;
        var leftChangedListener = function () {
            var newLeft = _this.column.getLeft();
            if (utils_1.Utils.exists(newLeft)) {
                _this.eGridCell.style.left = _this.column.getLeft() + 'px';
            }
            else {
                _this.eGridCell.style.left = '';
            }
        };
        this.column.addEventListener(column_1.Column.EVENT_LEFT_CHANGED, leftChangedListener);
        this.addDestroyFunc(function () {
            _this.column.removeEventListener(column_1.Column.EVENT_LEFT_CHANGED, leftChangedListener);
        });
        leftChangedListener();
    };
    RenderedCell.prototype.addRangeSelectedListener = function () {
        var _this = this;
        if (!this.rangeController) {
            return;
        }
        var rangeCountLastTime = 0;
        var rangeSelectedListener = function () {
            var rangeCount = _this.rangeController.getCellRangeCount(_this.gridCell);
            if (rangeCountLastTime !== rangeCount) {
                utils_1.Utils.addOrRemoveCssClass(_this.eGridCell, 'ag-cell-range-selected', rangeCount !== 0);
                utils_1.Utils.addOrRemoveCssClass(_this.eGridCell, 'ag-cell-range-selected-1', rangeCount === 1);
                utils_1.Utils.addOrRemoveCssClass(_this.eGridCell, 'ag-cell-range-selected-2', rangeCount === 2);
                utils_1.Utils.addOrRemoveCssClass(_this.eGridCell, 'ag-cell-range-selected-3', rangeCount === 3);
                utils_1.Utils.addOrRemoveCssClass(_this.eGridCell, 'ag-cell-range-selected-4', rangeCount >= 4);
                rangeCountLastTime = rangeCount;
            }
        };
        this.eventService.addEventListener(events_1.Events.EVENT_RANGE_SELECTION_CHANGED, rangeSelectedListener);
        this.addDestroyFunc(function () {
            _this.eventService.removeEventListener(events_1.Events.EVENT_RANGE_SELECTION_CHANGED, rangeSelectedListener);
        });
        rangeSelectedListener();
    };
    RenderedCell.prototype.addHighlightListener = function () {
        var _this = this;
        if (!this.rangeController) {
            return;
        }
        var clipboardListener = function (event) {
            var cellId = _this.gridCell.createId();
            var shouldFlash = event.cells[cellId];
            if (shouldFlash) {
                _this.animateCellWithHighlight();
            }
        };
        this.eventService.addEventListener(events_1.Events.EVENT_FLASH_CELLS, clipboardListener);
        this.addDestroyFunc(function () {
            _this.eventService.removeEventListener(events_1.Events.EVENT_FLASH_CELLS, clipboardListener);
        });
    };
    RenderedCell.prototype.addChangeListener = function () {
        var _this = this;
        var cellChangeListener = function (event) {
            if (event.column === _this.column) {
                _this.refreshCell();
                _this.animateCellWithDataChanged();
            }
        };
        this.addDestroyableEventListener(this.node, rowNode_1.RowNode.EVENT_CELL_CHANGED, cellChangeListener);
    };
    RenderedCell.prototype.animateCellWithDataChanged = function () {
        if (this.gridOptionsWrapper.isEnableCellChangeFlash() || this.column.getColDef().enableCellChangeFlash) {
            this.animateCell('data-changed');
        }
    };
    RenderedCell.prototype.animateCellWithHighlight = function () {
        this.animateCell('highlight');
    };
    RenderedCell.prototype.animateCell = function (cssName) {
        var _this = this;
        var fullName = 'ag-cell-' + cssName;
        var animationFullName = 'ag-cell-' + cssName + '-animation';
        // we want to highlight the cells, without any animation
        utils_1.Utils.addCssClass(this.eGridCell, fullName);
        utils_1.Utils.removeCssClass(this.eGridCell, animationFullName);
        // then once that is applied, we remove the highlight with animation
        setTimeout(function () {
            utils_1.Utils.removeCssClass(_this.eGridCell, fullName);
            utils_1.Utils.addCssClass(_this.eGridCell, animationFullName);
            setTimeout(function () {
                // and then to leave things as we got them, we remove the animation
                utils_1.Utils.removeCssClass(_this.eGridCell, animationFullName);
            }, 1000);
        }, 500);
    };
    RenderedCell.prototype.addCellFocusedListener = function () {
        var _this = this;
        // set to null, not false, as we need to set 'ag-cell-no-focus' first time around
        var cellFocusedLastTime = null;
        var cellFocusedListener = function (event) {
            var cellFocused = _this.focusedCellController.isCellFocused(_this.gridCell);
            // see if we need to change the classes on this cell
            if (cellFocused !== cellFocusedLastTime) {
                utils_1.Utils.addOrRemoveCssClass(_this.eGridCell, 'ag-cell-focus', cellFocused);
                utils_1.Utils.addOrRemoveCssClass(_this.eGridCell, 'ag-cell-no-focus', !cellFocused);
                cellFocusedLastTime = cellFocused;
            }
            // if this cell was just focused, see if we need to force browser focus, his can
            // happen if focus is programmatically set.
            if (cellFocused && event && event.forceBrowserFocus) {
                _this.eGridCell.focus();
            }
            // if another cell was focused, and we are editing, then stop editing
            if (_this.editingCell && !cellFocused) {
                _this.stopEditing();
            }
        };
        this.eventService.addEventListener(events_1.Events.EVENT_CELL_FOCUSED, cellFocusedListener);
        this.addDestroyFunc(function () {
            _this.eventService.removeEventListener(events_1.Events.EVENT_CELL_FOCUSED, cellFocusedListener);
        });
        cellFocusedListener();
    };
    RenderedCell.prototype.setWidthOnCell = function () {
        var _this = this;
        var widthChangedListener = function () {
            _this.eGridCell.style.width = _this.column.getActualWidth() + "px";
        };
        this.column.addEventListener(column_1.Column.EVENT_WIDTH_CHANGED, widthChangedListener);
        this.addDestroyFunc(function () {
            _this.column.removeEventListener(column_1.Column.EVENT_WIDTH_CHANGED, widthChangedListener);
        });
        widthChangedListener();
    };
    RenderedCell.prototype.init = function () {
        this.value = this.getValue();
        this.checkboxSelection = this.calculateCheckboxSelection();
        this.setLeftOnCell();
        this.setWidthOnCell();
        this.setPinnedClasses();
        this.addRangeSelectedListener();
        this.addHighlightListener();
        this.addChangeListener();
        this.addCellFocusedListener();
        this.addKeyDownListener();
        this.addKeyPressListener();
        // this.addFocusListener();
        // only set tab index if cell selection is enabled
        if (!this.gridOptionsWrapper.isSuppressCellSelection()) {
            this.eGridCell.setAttribute("tabindex", "-1");
        }
        // these are the grid styles, don't change between soft refreshes
        this.addClasses();
        this.setInlineEditingClass();
        this.createParentOfValue();
        this.populateCell();
    };
    RenderedCell.prototype.onEnterKeyDown = function () {
        if (this.editingCell) {
            this.stopEditing();
            this.focusCell(true);
        }
        else {
            this.startEditingIfEnabled(constants_1.Constants.KEY_ENTER);
        }
    };
    RenderedCell.prototype.onF2KeyDown = function () {
        if (!this.editingCell) {
            this.startEditingIfEnabled(constants_1.Constants.KEY_F2);
        }
    };
    RenderedCell.prototype.onEscapeKeyDown = function () {
        if (this.editingCell) {
            this.stopEditing(true);
            this.focusCell(true);
        }
    };
    RenderedCell.prototype.onPopupEditorClosed = function () {
        if (this.editingCell) {
            this.stopEditing(true);
            // we only focus cell again if this cell is still focused. it is possible
            // it is not focused if the user cancelled the edit by clicking on another
            // cell outside of this one
            if (this.focusedCellController.isCellFocused(this.gridCell)) {
                this.focusCell(true);
            }
        }
    };
    RenderedCell.prototype.onTabKeyDown = function (event) {
        var editNextCell;
        if (this.editingCell) {
            // if editing, we stop editing, then start editing next cell
            this.stopEditing();
            editNextCell = true;
        }
        else {
            // otherwise we just move to the next cell
            editNextCell = false;
        }
        this.rowRenderer.moveFocusToNextCell(this.rowIndex, this.column, this.node.floating, event.shiftKey, editNextCell);
        event.preventDefault();
    };
    RenderedCell.prototype.onBackspaceOrDeleteKeyPressed = function (key) {
        if (!this.editingCell) {
            this.startEditingIfEnabled(key);
        }
    };
    RenderedCell.prototype.onSpaceKeyPressed = function () {
        if (!this.editingCell && this.gridOptionsWrapper.isRowSelection()) {
            var selected = this.node.isSelected();
            this.node.setSelected(!selected);
        }
        // prevent default as space key, by default, moves browser scroll down
        event.preventDefault();
    };
    RenderedCell.prototype.onNavigationKeyPressed = function (event, key) {
        if (this.editingCell) {
            this.stopEditing();
        }
        this.rowRenderer.navigateToNextCell(key, this.rowIndex, this.column, this.node.floating);
        // if we don't prevent default, the grid will scroll with the navigation keys
        event.preventDefault();
    };
    /*
        private addFocusListener(): void {
            var that = this;
            var focusListener = (event: any) => {
    
                // if the focus went into another cell, then we stop editing this cell
                // if (that.editingCell &&!that.cellEditorInPopup && !that.gridCell.eq hasFocusLeftCell(event)) {
                //     that.stopEditing();
                // }
            };
            // this.eventService.
            // this.focusService.addListener(focusListener);
            // this.addDestroyFunc( () => {
            //     this.focusService.removeListener(focusListener);
            // });
        }
    */
    RenderedCell.prototype.addKeyPressListener = function () {
        var _this = this;
        var that = this;
        var keyPressListener = function (event) {
            if (!that.editingCell) {
                var pressedChar = String.fromCharCode(event.charCode);
                if (pressedChar === ' ') {
                    that.onSpaceKeyPressed();
                }
                else {
                    if (RenderedCell.PRINTABLE_CHARACTERS.indexOf(pressedChar) >= 0) {
                        that.startEditingIfEnabled(null, pressedChar);
                        // if we don't prevent default, then the keypress also gets applied to the text field
                        // (at least when doing the default editor), but we need to allow the editor to decide
                        // what it wants to do.
                        event.preventDefault();
                    }
                }
            }
        };
        this.eGridCell.addEventListener('keypress', keyPressListener);
        this.addDestroyFunc(function () {
            _this.eGridCell.removeEventListener('keypress', keyPressListener);
        });
    };
    RenderedCell.prototype.onKeyDown = function (event) {
        var key = event.which || event.keyCode;
        switch (key) {
            case constants_1.Constants.KEY_ENTER:
                this.onEnterKeyDown();
                break;
            case constants_1.Constants.KEY_F2:
                this.onF2KeyDown();
                break;
            case constants_1.Constants.KEY_ESCAPE:
                this.onEscapeKeyDown();
                break;
            case constants_1.Constants.KEY_TAB:
                this.onTabKeyDown(event);
                break;
            case constants_1.Constants.KEY_BACKSPACE:
            case constants_1.Constants.KEY_DELETE:
                this.onBackspaceOrDeleteKeyPressed(key);
                break;
            case constants_1.Constants.KEY_DOWN:
            case constants_1.Constants.KEY_UP:
            case constants_1.Constants.KEY_RIGHT:
            case constants_1.Constants.KEY_LEFT:
                this.onNavigationKeyPressed(event, key);
                break;
        }
    };
    RenderedCell.prototype.addKeyDownListener = function () {
        var _this = this;
        var editingKeyListener = this.onKeyDown.bind(this);
        this.eGridCell.addEventListener('keydown', editingKeyListener);
        this.addDestroyFunc(function () {
            _this.eGridCell.removeEventListener('keydown', editingKeyListener);
        });
    };
    RenderedCell.prototype.createCellEditor = function (keyPress, charPress) {
        var colDef = this.column.getColDef();
        var cellEditor = this.cellEditorFactory.createCellEditor(colDef.cellEditor);
        if (cellEditor.init) {
            var params = {
                value: this.getValue(),
                keyPress: keyPress,
                charPress: charPress,
                column: this.column,
                node: this.node,
                api: this.gridOptionsWrapper.getApi(),
                columnApi: this.gridOptionsWrapper.getColumnApi(),
                context: this.gridOptionsWrapper.getContext(),
                onKeyDown: this.onKeyDown.bind(this),
                stopEditing: this.stopEditingAndFocus.bind(this)
            };
            if (colDef.cellEditorParams) {
                utils_1.Utils.assign(params, colDef.cellEditorParams);
            }
            if (cellEditor.init) {
                cellEditor.init(params);
            }
        }
        return cellEditor;
    };
    // cell editors call this, when they want to stop for reasons other
    // than what we pick up on. eg selecting from a dropdown ends editing.
    RenderedCell.prototype.stopEditingAndFocus = function () {
        this.stopEditing();
        this.focusCell(true);
    };
    // called by rowRenderer when user navigates via tab key
    RenderedCell.prototype.startEditingIfEnabled = function (keyPress, charPress) {
        if (!this.isCellEditable()) {
            return;
        }
        this.cellEditor = this.createCellEditor(keyPress, charPress);
        if (!this.cellEditor.getGui) {
            console.warn("ag-Grid: cellEditor for column " + this.column.getId() + " is missing getGui() method");
            return;
        }
        this.editingCell = true;
        this.cellEditorInPopup = this.cellEditor.isPopup && this.cellEditor.isPopup();
        this.setInlineEditingClass();
        if (this.cellEditorInPopup) {
            this.addPopupCellEditor();
        }
        else {
            this.addInCellEditor();
        }
        if (this.cellEditor.afterGuiAttached) {
            this.cellEditor.afterGuiAttached();
        }
    };
    RenderedCell.prototype.addInCellEditor = function () {
        utils_1.Utils.removeAllChildren(this.eGridCell);
        this.eGridCell.appendChild(this.cellEditor.getGui());
        if (this.gridOptionsWrapper.isAngularCompileRows()) {
            this.$compile(this.eGridCell)(this.scope);
        }
    };
    RenderedCell.prototype.addPopupCellEditor = function () {
        var _this = this;
        var ePopupGui = this.cellEditor.getGui();
        this.hideEditorPopup = this.popupService.addAsModalPopup(ePopupGui, true, 
        // callback for when popup disappears
        function () {
            // we only call stopEditing if we are editing, as
            // it's possible the popup called 'stop editing'
            // before this, eg if 'enter key' was pressed on
            // the editor
            if (_this.editingCell) {
                _this.onPopupEditorClosed();
            }
        });
        this.popupService.positionPopupOverComponent({
            eventSource: this.eGridCell,
            ePopup: ePopupGui,
            keepWithinBounds: true
        });
        if (this.gridOptionsWrapper.isAngularCompileRows()) {
            this.$compile(ePopupGui)(this.scope);
        }
    };
    RenderedCell.prototype.focusCell = function (forceBrowserFocus) {
        this.focusedCellController.setFocusedCell(this.rowIndex, this.column, this.node.floating, forceBrowserFocus);
    };
    RenderedCell.prototype.stopEditing = function (reset) {
        if (reset === void 0) { reset = false; }
        this.editingCell = false;
        if (!reset) {
            var newValue = this.cellEditor.getValue();
            this.valueService.setValue(this.node, this.column, newValue);
            this.value = this.getValue();
        }
        if (this.cellEditor.destroy) {
            this.cellEditor.destroy();
        }
        if (this.cellEditorInPopup) {
            this.hideEditorPopup();
            this.hideEditorPopup = null;
        }
        else {
            utils_1.Utils.removeAllChildren(this.eGridCell);
            // put the cell back the way it was before editing
            if (this.checkboxSelection) {
                // if wrapper, then put the wrapper back
                this.eGridCell.appendChild(this.eCellWrapper);
            }
            else {
                // if cellRenderer, then put the gui back in. if the renderer has
                // a refresh, it will be called. however if it doesn't, then later
                // the renderer will be destroyed and a new one will be created.
                if (this.cellRenderer) {
                    this.eGridCell.appendChild(this.cellRenderer.getGui());
                }
            }
        }
        this.setInlineEditingClass();
        this.refreshCell();
    };
    RenderedCell.prototype.createParams = function () {
        var params = {
            node: this.node,
            data: this.node.data,
            value: this.value,
            rowIndex: this.rowIndex,
            colDef: this.column.getColDef(),
            $scope: this.scope,
            context: this.gridOptionsWrapper.getContext(),
            api: this.gridApi,
            columnApi: this.columnApi
        };
        return params;
    };
    RenderedCell.prototype.createEvent = function (event, eventSource) {
        var agEvent = this.createParams();
        agEvent.event = event;
        //agEvent.eventSource = eventSource;
        return agEvent;
    };
    RenderedCell.prototype.isCellEditable = function () {
        if (this.editingCell) {
            return false;
        }
        // never allow editing of groups
        if (this.node.group) {
            return false;
        }
        return this.column.isCellEditable(this.node);
    };
    RenderedCell.prototype.onMouseEvent = function (eventName, mouseEvent, eventSource) {
        switch (eventName) {
            case 'click':
                this.onCellClicked(mouseEvent);
                break;
            case 'mousedown':
                this.onMouseDown();
                break;
            case 'dblclick':
                this.onCellDoubleClicked(mouseEvent, eventSource);
                break;
            case 'contextmenu':
                this.onContextMenu(mouseEvent);
                break;
        }
    };
    RenderedCell.prototype.onContextMenu = function (mouseEvent) {
        // to allow us to debug in chrome, we ignore the event if ctrl is pressed,
        // thus the normal menu is displayed
        if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
            return;
        }
        var colDef = this.column.getColDef();
        var agEvent = this.createEvent(mouseEvent);
        this.eventService.dispatchEvent(events_1.Events.EVENT_CELL_CONTEXT_MENU, agEvent);
        if (colDef.onCellContextMenu) {
            colDef.onCellContextMenu(agEvent);
        }
        if (this.contextMenuFactory && !this.gridOptionsWrapper.isSuppressContextMenu()) {
            this.contextMenuFactory.showMenu(this.node, this.column, this.value, mouseEvent);
            mouseEvent.preventDefault();
        }
    };
    RenderedCell.prototype.onCellDoubleClicked = function (mouseEvent, eventSource) {
        var colDef = this.column.getColDef();
        // always dispatch event to eventService
        var agEvent = this.createEvent(mouseEvent, eventSource);
        this.eventService.dispatchEvent(events_1.Events.EVENT_CELL_DOUBLE_CLICKED, agEvent);
        // check if colDef also wants to handle event
        if (typeof colDef.onCellDoubleClicked === 'function') {
            colDef.onCellDoubleClicked(agEvent);
        }
        if (!this.gridOptionsWrapper.isSingleClickEdit()) {
            this.startEditingIfEnabled();
        }
    };
    RenderedCell.prototype.onMouseDown = function () {
        // we pass false to focusCell, as we don't want the cell to focus
        // also get the browser focus. if we did, then the cellRenderer could
        // have a text field in it, for example, and as the user clicks on the
        // text field, the text field, the focus doesn't get to the text
        // field, instead to goes to the div behind, making it impossible to
        // select the text field.
        this.focusCell(false);
        // if it's a right click, then if the cell is already in range,
        // don't change the range, however if the cell is not in a range,
        // we set a new range
        if (this.rangeController) {
            var thisCell = this.gridCell;
            var cellAlreadyInRange = this.rangeController.isCellInAnyRange(thisCell);
            if (!cellAlreadyInRange) {
                this.rangeController.setRangeToCell(thisCell);
            }
        }
    };
    RenderedCell.prototype.onCellClicked = function (mouseEvent) {
        var agEvent = this.createEvent(mouseEvent, this);
        this.eventService.dispatchEvent(events_1.Events.EVENT_CELL_CLICKED, agEvent);
        var colDef = this.column.getColDef();
        if (colDef.onCellClicked) {
            colDef.onCellClicked(agEvent);
        }
        if (this.gridOptionsWrapper.isSingleClickEdit()) {
            this.startEditingIfEnabled();
        }
    };
    // if we are editing inline, then we don't have the padding in the cell (set in the themes)
    // to allow the text editor full access to the entire cell
    RenderedCell.prototype.setInlineEditingClass = function () {
        var editingInline = this.editingCell && !this.cellEditorInPopup;
        utils_1.Utils.addOrRemoveCssClass(this.eGridCell, 'ag-cell-inline-editing', editingInline);
        utils_1.Utils.addOrRemoveCssClass(this.eGridCell, 'ag-cell-not-inline-editing', !editingInline);
    };
    RenderedCell.prototype.populateCell = function () {
        // populate
        this.putDataIntoCell();
        // style
        this.addStylesFromColDef();
        this.addClassesFromColDef();
        this.addClassesFromRules();
    };
    RenderedCell.prototype.addStylesFromColDef = function () {
        var colDef = this.column.getColDef();
        if (colDef.cellStyle) {
            var cssToUse;
            if (typeof colDef.cellStyle === 'function') {
                var cellStyleParams = {
                    value: this.value,
                    data: this.node.data,
                    node: this.node,
                    colDef: colDef,
                    column: this.column,
                    $scope: this.scope,
                    context: this.gridOptionsWrapper.getContext(),
                    api: this.gridOptionsWrapper.getApi()
                };
                var cellStyleFunc = colDef.cellStyle;
                cssToUse = cellStyleFunc(cellStyleParams);
            }
            else {
                cssToUse = colDef.cellStyle;
            }
            if (cssToUse) {
                utils_1.Utils.addStylesToElement(this.eGridCell, cssToUse);
            }
        }
    };
    RenderedCell.prototype.addClassesFromColDef = function () {
        var _this = this;
        var colDef = this.column.getColDef();
        if (colDef.cellClass) {
            var classToUse;
            if (typeof colDef.cellClass === 'function') {
                var cellClassParams = {
                    value: this.value,
                    data: this.node.data,
                    node: this.node,
                    colDef: colDef,
                    $scope: this.scope,
                    context: this.gridOptionsWrapper.getContext(),
                    api: this.gridOptionsWrapper.getApi()
                };
                var cellClassFunc = colDef.cellClass;
                classToUse = cellClassFunc(cellClassParams);
            }
            else {
                classToUse = colDef.cellClass;
            }
            if (typeof classToUse === 'string') {
                utils_1.Utils.addCssClass(this.eGridCell, classToUse);
            }
            else if (Array.isArray(classToUse)) {
                classToUse.forEach(function (cssClassItem) {
                    utils_1.Utils.addCssClass(_this.eGridCell, cssClassItem);
                });
            }
        }
    };
    RenderedCell.prototype.addClassesFromRules = function () {
        var colDef = this.column.getColDef();
        var classRules = colDef.cellClassRules;
        if (typeof classRules === 'object' && classRules !== null) {
            var params = {
                value: this.value,
                data: this.node.data,
                node: this.node,
                colDef: colDef,
                rowIndex: this.rowIndex,
                api: this.gridOptionsWrapper.getApi(),
                context: this.gridOptionsWrapper.getContext()
            };
            var classNames = Object.keys(classRules);
            for (var i = 0; i < classNames.length; i++) {
                var className = classNames[i];
                var rule = classRules[className];
                var resultOfRule;
                if (typeof rule === 'string') {
                    resultOfRule = this.expressionService.evaluate(rule, params);
                }
                else if (typeof rule === 'function') {
                    resultOfRule = rule(params);
                }
                if (resultOfRule) {
                    utils_1.Utils.addCssClass(this.eGridCell, className);
                }
                else {
                    utils_1.Utils.removeCssClass(this.eGridCell, className);
                }
            }
        }
    };
    RenderedCell.prototype.createParentOfValue = function () {
        if (this.checkboxSelection) {
            this.eCellWrapper = document.createElement('span');
            utils_1.Utils.addCssClass(this.eCellWrapper, 'ag-cell-wrapper');
            this.eGridCell.appendChild(this.eCellWrapper);
            //this.createSelectionCheckbox();
            this.eCheckbox = this.selectionRendererFactory.createSelectionCheckbox(this.node, this.renderedRow.addEventListener.bind(this.renderedRow));
            this.eCellWrapper.appendChild(this.eCheckbox);
            // eventually we call eSpanWithValue.innerHTML = xxx, so cannot include the checkbox (above) in this span
            this.eSpanWithValue = document.createElement('span');
            utils_1.Utils.addCssClass(this.eSpanWithValue, 'ag-cell-value');
            this.eCellWrapper.appendChild(this.eSpanWithValue);
            this.eParentOfValue = this.eSpanWithValue;
        }
        else {
            utils_1.Utils.addCssClass(this.eGridCell, 'ag-cell-value');
            this.eParentOfValue = this.eGridCell;
        }
    };
    RenderedCell.prototype.isVolatile = function () {
        return this.column.getColDef().volatile;
    };
    RenderedCell.prototype.refreshCell = function (animate, newData) {
        if (animate === void 0) { animate = false; }
        if (newData === void 0) { newData = false; }
        this.value = this.getValue();
        // if it's 'new data', then we don't refresh the cellRenderer, even if refresh method is available.
        // this is because if the whole data is new (ie we are showing stock price 'BBA' now and not 'SSD')
        // then we are not showing a movement in the stock price, rather we are showing different stock.
        if (!newData && this.cellRenderer && this.cellRenderer.refresh) {
            // if the cell renderer has a refresh method, we call this instead of doing a refresh
            // note: should pass in params here instead of value?? so that client has formattedValue
            var valueFormatted = this.formatValue(this.value);
            var cellRendererParams = this.column.getColDef().cellRendererParams;
            var params = this.createRendererAndRefreshParams(valueFormatted, cellRendererParams);
            this.cellRenderer.refresh(params);
            // need to check rules. note, we ignore colDef classes and styles, these are assumed to be static
            this.addClassesFromRules();
        }
        else {
            // otherwise we rip out the cell and replace it
            utils_1.Utils.removeAllChildren(this.eParentOfValue);
            // remove old renderer component if it exists
            if (this.cellRenderer && this.cellRenderer.destroy) {
                this.cellRenderer.destroy();
            }
            this.cellRenderer = null;
            this.populateCell();
            // if angular compiling, then need to also compile the cell again (angular compiling sucks, please wait...)
            if (this.gridOptionsWrapper.isAngularCompileRows()) {
                this.$compile(this.eGridCell)(this.scope);
            }
        }
        if (animate) {
            this.animateCellWithDataChanged();
        }
    };
    RenderedCell.prototype.putDataIntoCell = function () {
        // template gets preference, then cellRenderer, then do it ourselves
        var colDef = this.column.getColDef();
        var valueFormatted = this.valueFormatterService.formatValue(this.column, this.node, this.scope, this.rowIndex, this.value);
        if (colDef.template) {
            this.eParentOfValue.innerHTML = colDef.template;
        }
        else if (colDef.templateUrl) {
            var template = this.templateService.getTemplate(colDef.templateUrl, this.refreshCell.bind(this, true));
            if (template) {
                this.eParentOfValue.innerHTML = template;
            }
        }
        else if (colDef.floatingCellRenderer && this.node.floating) {
            this.useCellRenderer(colDef.floatingCellRenderer, colDef.floatingCellRendererParams, valueFormatted);
        }
        else if (colDef.cellRenderer) {
            this.useCellRenderer(colDef.cellRenderer, colDef.cellRendererParams, valueFormatted);
        }
        else {
            // if we insert undefined, then it displays as the string 'undefined', ugly!
            var valueToRender = utils_1.Utils.exists(valueFormatted) ? valueFormatted : this.value;
            if (utils_1.Utils.exists(valueToRender) && valueToRender !== '') {
                this.eParentOfValue.innerHTML = valueToRender.toString();
            }
        }
    };
    RenderedCell.prototype.formatValue = function (value) {
        return this.valueFormatterService.formatValue(this.column, this.node, this.scope, this.rowIndex, value);
    };
    RenderedCell.prototype.createRendererAndRefreshParams = function (valueFormatted, cellRendererParams) {
        var params = {
            value: this.value,
            valueFormatted: valueFormatted,
            valueGetter: this.getValue,
            formatValue: this.formatValue.bind(this),
            data: this.node.data,
            node: this.node,
            colDef: this.column.getColDef(),
            column: this.column,
            $scope: this.scope,
            rowIndex: this.rowIndex,
            api: this.gridOptionsWrapper.getApi(),
            columnApi: this.gridOptionsWrapper.getColumnApi(),
            context: this.gridOptionsWrapper.getContext(),
            refreshCell: this.refreshCell.bind(this),
            eGridCell: this.eGridCell,
            eParentOfValue: this.eParentOfValue,
            addRenderedRowListener: this.renderedRow.addEventListener.bind(this.renderedRow)
        };
        if (cellRendererParams) {
            utils_1.Utils.assign(params, cellRendererParams);
        }
        return params;
    };
    RenderedCell.prototype.useCellRenderer = function (cellRendererKey, cellRendererParams, valueFormatted) {
        var params = this.createRendererAndRefreshParams(valueFormatted, cellRendererParams);
        this.cellRenderer = this.cellRendererService.useCellRenderer(cellRendererKey, this.eParentOfValue, params);
    };
    RenderedCell.prototype.addClasses = function () {
        utils_1.Utils.addCssClass(this.eGridCell, 'ag-cell');
        this.eGridCell.setAttribute("colId", this.column.getColId());
        if (this.node.group && this.node.footer) {
            utils_1.Utils.addCssClass(this.eGridCell, 'ag-footer-cell');
        }
        if (this.node.group && !this.node.footer) {
            utils_1.Utils.addCssClass(this.eGridCell, 'ag-group-cell');
        }
    };
    RenderedCell.PRINTABLE_CHARACTERS = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890!"£$%^&*()_+-=[];\'#,./\|<>?:@~{}';
    __decorate([
        context_1.Autowired('context'), 
        __metadata('design:type', context_1.Context)
    ], RenderedCell.prototype, "context", void 0);
    __decorate([
        context_1.Autowired('columnApi'), 
        __metadata('design:type', columnController_1.ColumnApi)
    ], RenderedCell.prototype, "columnApi", void 0);
    __decorate([
        context_1.Autowired('gridApi'), 
        __metadata('design:type', gridApi_1.GridApi)
    ], RenderedCell.prototype, "gridApi", void 0);
    __decorate([
        context_1.Autowired('gridOptionsWrapper'), 
        __metadata('design:type', gridOptionsWrapper_1.GridOptionsWrapper)
    ], RenderedCell.prototype, "gridOptionsWrapper", void 0);
    __decorate([
        context_1.Autowired('expressionService'), 
        __metadata('design:type', expressionService_1.ExpressionService)
    ], RenderedCell.prototype, "expressionService", void 0);
    __decorate([
        context_1.Autowired('selectionRendererFactory'), 
        __metadata('design:type', selectionRendererFactory_1.SelectionRendererFactory)
    ], RenderedCell.prototype, "selectionRendererFactory", void 0);
    __decorate([
        context_1.Autowired('rowRenderer'), 
        __metadata('design:type', rowRenderer_1.RowRenderer)
    ], RenderedCell.prototype, "rowRenderer", void 0);
    __decorate([
        context_1.Autowired('$compile'), 
        __metadata('design:type', Object)
    ], RenderedCell.prototype, "$compile", void 0);
    __decorate([
        context_1.Autowired('templateService'), 
        __metadata('design:type', templateService_1.TemplateService)
    ], RenderedCell.prototype, "templateService", void 0);
    __decorate([
        context_1.Autowired('valueService'), 
        __metadata('design:type', valueService_1.ValueService)
    ], RenderedCell.prototype, "valueService", void 0);
    __decorate([
        context_1.Autowired('eventService'), 
        __metadata('design:type', eventService_1.EventService)
    ], RenderedCell.prototype, "eventService", void 0);
    __decorate([
        context_1.Autowired('columnController'), 
        __metadata('design:type', columnController_1.ColumnController)
    ], RenderedCell.prototype, "columnController", void 0);
    __decorate([
        context_1.Optional('rangeController'), 
        __metadata('design:type', Object)
    ], RenderedCell.prototype, "rangeController", void 0);
    __decorate([
        context_1.Autowired('focusedCellController'), 
        __metadata('design:type', focusedCellController_1.FocusedCellController)
    ], RenderedCell.prototype, "focusedCellController", void 0);
    __decorate([
        context_1.Optional('contextMenuFactory'), 
        __metadata('design:type', Object)
    ], RenderedCell.prototype, "contextMenuFactory", void 0);
    __decorate([
        context_1.Autowired('focusService'), 
        __metadata('design:type', focusService_1.FocusService)
    ], RenderedCell.prototype, "focusService", void 0);
    __decorate([
        context_1.Autowired('cellEditorFactory'), 
        __metadata('design:type', cellEditorFactory_1.CellEditorFactory)
    ], RenderedCell.prototype, "cellEditorFactory", void 0);
    __decorate([
        context_1.Autowired('cellRendererFactory'), 
        __metadata('design:type', cellRendererFactory_1.CellRendererFactory)
    ], RenderedCell.prototype, "cellRendererFactory", void 0);
    __decorate([
        context_1.Autowired('popupService'), 
        __metadata('design:type', popupService_1.PopupService)
    ], RenderedCell.prototype, "popupService", void 0);
    __decorate([
        context_1.Autowired('cellRendererService'), 
        __metadata('design:type', cellRendererService_1.CellRendererService)
    ], RenderedCell.prototype, "cellRendererService", void 0);
    __decorate([
        context_1.Autowired('valueFormatterService'), 
        __metadata('design:type', valueFormatterService_1.ValueFormatterService)
    ], RenderedCell.prototype, "valueFormatterService", void 0);
    __decorate([
        context_1.PostConstruct, 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], RenderedCell.prototype, "init", null);
    return RenderedCell;
})(component_1.Component);
exports.RenderedCell = RenderedCell;
