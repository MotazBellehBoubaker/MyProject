sap.ui.define([
    "sentinel/security/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("sentinel.security.controller.Compliance", {

        onInit: function () {
            this.getRouter().getRoute("compliance").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {},

        onReevaluate: function () {
            this.showToast("Baseline re-evaluated against latest SAP security notes");
        }
    });
});
