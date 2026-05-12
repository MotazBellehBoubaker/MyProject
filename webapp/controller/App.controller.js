sap.ui.define([
    "sentinel/security/controller/BaseController",
    "sentinel/security/service/CopilotService",
    "sap/ui/model/json/JSONModel"
], function (BaseController, CopilotService, JSONModel) {
    "use strict";

    return BaseController.extend("sentinel.security.controller.App", {

        onInit: function () {
            var oComponent = this.getOwnerComponent();
            this.getView().addStyleClass(oComponent.getContentDensityClass());
            this._copilotHistory = [];
        },

        onNavItemSelect: function (oEvent) {
            var sKey = oEvent.getParameter("item").getKey();
            this.navTo(sKey);
        },

        onSideNavToggle: function () {
            var oToolPage = this.byId("toolPage");
            oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
        },

        onGlobalSearch: function (oEvent) {
            this.showToast("Global search: " + oEvent.getParameter("query"));
        },

        onNotifications: function () {
            this.showToast("Notifications: 3 new high severity violations");
        },

        onSettings: function () { this.navTo("settings"); },
        onProfilePress: function () { this.showToast("Profile: Marcus Reinholt · Basis Admin"); },

        // ── Co-pilot ──
        onOpenCopilot: function () {
            if (!this._oCopilotDialog) {
                this._oCopilotDialog = sap.ui.xmlfragment(
                    this.getView().getId(),
                    "sentinel.security.fragment.CopilotDrawer",
                    this
                );
                this.getView().addDependent(this._oCopilotDialog);
            }
            this._copilotHistory = [];
            this.getModel("appState").setProperty("/copilotMessages", [{
                role: "assistant",
                content: "Hi Marcus! I'm grounded on scan SC-2026-031. You have 18 open violations and a system risk score of 78. How can I help?",
                htmlContent: "Hi Marcus 👋 I'm grounded on <strong>SC-2026-031</strong>. You have <strong style='color:var(--sapNegativeColor)'>18 open violations</strong> and risk score <strong>78</strong>. How can I help?"
            }]);
            this._oCopilotDialog.open();
        },

        onCloseCopilot: function () { if (this._oCopilotDialog) this._oCopilotDialog.close(); },

        onClearChat: function () {
            this._copilotHistory = [];
            this.getModel("appState").setProperty("/copilotMessages", [{
                role: "assistant", content: "Chat cleared.", htmlContent: "Chat cleared. How can I help?"
            }]);
        },

        onSuggestion: function (oEvent) { this._sendCopilotMessage(oEvent.getSource().getText()); },

        onCopilotSubmit: function () {
            var oInput = this.byId("copilotInputField");
            var sText = oInput ? oInput.getValue().trim() : "";
            if (!sText) return;
            if (oInput) oInput.setValue("");
            this._sendCopilotMessage(sText);
        },

        _sendCopilotMessage: function (sText) {
            var oAppState = this.getModel("appState");
            var aMessages = (oAppState.getProperty("/copilotMessages") || []).concat([{
                role: "user", content: sText, htmlContent: sText.replace(/</g,"&lt;")
            }]);
            oAppState.setProperty("/copilotMessages", aMessages.concat([{
                role: "assistant", content: "...", htmlContent: "<em>Thinking…</em>", loading: true
            }]));
            oAppState.setProperty("/copilotLoading", true);

            CopilotService.sendMessage(sText, this._copilotHistory.slice(-6))
                .then(function (sReply) {
                    this._copilotHistory.push({ role: "user", content: sText });
                    this._copilotHistory.push({ role: "assistant", content: sReply });
                    oAppState.setProperty("/copilotMessages", aMessages.concat([{
                        role: "assistant", content: sReply,
                        htmlContent: sReply.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>")
                    }]));
                    oAppState.setProperty("/copilotLoading", false);
                }.bind(this))
                .catch(function () {
                    oAppState.setProperty("/copilotMessages", aMessages.concat([{
                        role: "assistant", content: "Error.", htmlContent: "<span style='color:red'>Connection error. Please retry.</span>"
                    }]));
                    oAppState.setProperty("/copilotLoading", false);
                }.bind(this));
        }
    });
});
