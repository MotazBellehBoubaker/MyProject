sap.ui.define([
    "sentinel/security/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("sentinel.security.controller.CriticalRoles", {

        onInit: function () {
            this.getRouter().getRoute("critical").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {},

        onExport: function () {
            this.showToast("Exporting critical roles CSV…");
        },

        onSubscribeAlerts: function () {
            this.showToast("Subscribed to critical role alerts via SAP Alert Notification");
        },

        onRequestRemoval: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("criticalRoles");
            var sUser = oCtx.getProperty("userName");
            var sProfile = oCtx.getProperty("profile");
            this.showToast("Removal request raised for " + sUser + " · " + sProfile);
        },

        onUserPress: function (oEvent) {
            var sUserId = oEvent.getSource().getBindingContext("criticalRoles").getProperty("userId");
            this.navTo("userDetail", { userId: sUserId });
        }
    });
});
