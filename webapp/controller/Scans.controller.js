sap.ui.define([
    "sentinel/security/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("sentinel.security.controller.Scans", {

        onInit: function () {
            this.getRouter().getRoute("scans").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {},

        onTriggerScan: function () {
            this.navTo("overview");
            setTimeout(function () {
                this.showToast("Scan triggered — navigate to Overview to track progress");
            }.bind(this), 300);
        },

        onExport: function () {
            this.showToast("Exporting scan history CSV…");
        },

        onPromoteToTest: function () {
            this.showToast("Transport request created · TMS-2026-031 · Awaiting approval");
        }
    });
});
