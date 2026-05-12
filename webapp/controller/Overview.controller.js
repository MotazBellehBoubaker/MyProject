sap.ui.define([
    "sentinel/security/controller/BaseController",
    "sentinel/security/service/CopilotService",
    "sap/ui/model/json/JSONModel"
], function (BaseController, CopilotService, JSONModel) {
    "use strict";

    return BaseController.extend("sentinel.security.controller.Overview", {

        onInit: function () {
            this.getRouter().getRoute("overview").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._updateBreadcrumb("Overview");
        },

        _updateBreadcrumb: function (sPage) {
            var oAppModel = this.getModel("appState");
            if (oAppModel) {
                oAppModel.setProperty("/currentPage", sPage);
            }
        },

        onTriggerScan: function () {
            var oAppState = this.getModel("appState");
            oAppState.setProperty("/scanning", true);
            oAppState.setProperty("/scanProgress", 0);

            var iProgress = 0;
            var oInterval = setInterval(function () {
                iProgress += Math.random() * 18;
                if (iProgress >= 100) {
                    iProgress = 100;
                    clearInterval(oInterval);
                    setTimeout(function () {
                        oAppState.setProperty("/scanning", false);
                        oAppState.setProperty("/scanProgress", 0);
                        this.showToast("Scan SC-2026-032 complete · 4,218 users · 18 violations · Risk: 78");
                    }.bind(this), 400);
                }
                oAppState.setProperty("/scanProgress", iProgress / 100);
            }.bind(this), 280);
        },

        onExportOverview: function () {
            this.showToast("Exporting overview report…");
        },

        onGenerateBriefing: function () {
            var oAppState = this.getModel("appState");
            oAppState.setProperty("/execSummaryLoading", true);
            oAppState.setProperty("/execSummary", null);

            CopilotService.generateBriefing()
                .then(function (sResult) {
                    oAppState.setProperty("/execSummary", sResult);
                    oAppState.setProperty("/execSummaryLoading", false);
                }.bind(this))
                .catch(function () {
                    oAppState.setProperty("/execSummaryLoading", false);
                    this.showError("Failed to generate briefing. Check API connectivity.");
                }.bind(this));
        },

        onGenerateTriage: function () {
            var oAppState = this.getModel("appState");
            oAppState.setProperty("/triageLoading", true);
            oAppState.setProperty("/triageInsights", null);

            CopilotService.generateTriage()
                .then(function (aResults) {
                    oAppState.setProperty("/triageInsights", aResults);
                    oAppState.setProperty("/triageLoading", false);
                }.bind(this))
                .catch(function () {
                    oAppState.setProperty("/triageLoading", false);
                    this.showError("Failed to analyze violations. Check API connectivity.");
                }.bind(this));
        },

        onViewAllViolations: function () {
            this.navTo("violations");
        },

        onNavTo: function (oEvent) {
            // Generic tile nav — reads key from tile header text
            var sHeader = oEvent.getSource().getHeader();
            var mMap = {
                "Critical Roles": "critical",
                "Compliance":      "compliance",
                "Open Violations": "violations",
                "System Risk Score":"violations"
            };
            var sRoute = mMap[sHeader] || "overview";
            this.navTo(sRoute);
        },

        onNavToCritical: function () { this.navTo("critical"); },
        onNavToCompliance: function () { this.navTo("compliance"); },

        onViewAllUsers: function () {
            this.navTo("users");
        },

        onUserPress: function (oEvent) {
            var sUserId = oEvent.getSource().getBindingContext("users").getProperty("id");
            this.navTo("userDetail", { userId: sUserId });
        },

        onViolationPress: function (oEvent) {
            this.navTo("violations");
        },

        onPromoteToTest: function () {
            this.showToast("Transport request created · TMS-2026-031 · Awaiting approval");
        }
    });
});
