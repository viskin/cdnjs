/**
 * ag-grid - Advanced Data Grid / Data Table supporting Javascript / React / AngularJS / Web Components
 * @version v4.1.3
 * @link http://www.ag-grid.com/
 * @license MIT
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var component_1 = require("../../widgets/component");
var PopupEditorWrapper = (function (_super) {
    __extends(PopupEditorWrapper, _super);
    function PopupEditorWrapper(cellEditor) {
        _super.call(this, '<div class="ag-popup-editor"/>');
        this.getGuiCalledOnChild = false;
        this.cellEditor = cellEditor;
        this.addDestroyFunc(function () { return cellEditor.destroy(); });
        this.addDestroyableEventListener(this.getGui(), 'keydown', this.onKeyDown.bind(this));
    }
    PopupEditorWrapper.prototype.onKeyDown = function (event) {
        this.params.onKeyDown(event);
    };
    PopupEditorWrapper.prototype.getGui = function () {
        // we call getGui() on child here (rather than in the constructor)
        // as we should wait for 'init' to be called on child first.
        if (!this.getGuiCalledOnChild) {
            this.appendChild(this.cellEditor.getGui());
            this.getGuiCalledOnChild = true;
        }
        return _super.prototype.getGui.call(this);
    };
    PopupEditorWrapper.prototype.init = function (params) {
        this.params = params;
        if (this.cellEditor.init) {
            this.cellEditor.init(params);
        }
    };
    PopupEditorWrapper.prototype.afterGuiAttached = function () {
        if (this.cellEditor.afterGuiAttached) {
            this.cellEditor.afterGuiAttached();
        }
    };
    PopupEditorWrapper.prototype.getValue = function () {
        return this.cellEditor.getValue();
    };
    PopupEditorWrapper.prototype.isPopup = function () {
        return true;
    };
    return PopupEditorWrapper;
})(component_1.Component);
exports.PopupEditorWrapper = PopupEditorWrapper;
