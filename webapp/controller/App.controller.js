sap.ui.define([
    "sentinel/security/controller/BaseController",
    "sentinel/security/service/CopilotService",
    "sap/m/Popover",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/m/Avatar",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/ScrollContainer",
    "sap/m/Bar",
    "sap/m/Title",
    "sap/m/FormattedText",
    "sap/m/MessageToast",
    "sap/ui/core/Icon",
    "sap/m/ObjectStatus",
    "sap/m/Label"
], function (
    BaseController, CopilotService,
    Popover, VBox, HBox, Text, Avatar, Button, Dialog,
    Input, ScrollContainer, Bar, Title,
    FormattedText, MessageToast, Icon, ObjectStatus, Label
) {
    "use strict";

    return BaseController.extend("sentinel.security.controller.App", {

        onInit: function () {
            this.getView().addStyleClass(
                this.getOwnerComponent().getContentDensityClass()
            );
            this._copilotHistory = [];
            this._copilotMessages = [];
        },

        // ── Navigation ──────────────────────────────────────────────────────
        onNavItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey ? oItem.getKey() : "";
            var mRoutes = {
                overview: "overview", violations: "violations", users: "users",
                critical: "critical", compliance: "compliance", rules: "rules",
                scans: "scans", alerts: "alerts", settings: "settings"
            };
            if (mRoutes[sKey]) this.navTo(mRoutes[sKey]);
        },

        onSideNavToggle: function () {
            var oPage = this.byId("toolPage");
            oPage.setSideExpanded(!oPage.getSideExpanded());
        },

        // ── System Selector ─────────────────────────────────────────────────
        onSystemChange: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            var oStatus = this.byId("connectionStatus");
            oStatus.setState("Warning");
            oStatus.setText("Connecting...");
            oStatus.setIcon("sap-icon://refresh");
            setTimeout(function () {
                oStatus.setState("Success");
                oStatus.setText(sKey + " Connected");
                oStatus.setIcon("sap-icon://connected");
                MessageToast.show("Switched to " + sKey + " system");
            }, 1200);
        },

        // ── Notifications ────────────────────────────────────────────────────
        onNotifications: function () {
            MessageToast.show("3 new alerts: 2 High violations, 1 compliance drop");
        },

        // ── Profile Popover ──────────────────────────────────────────────────
        onProfilePress: function (oEvent) {
            var that = this;
            if (!this._oProfilePopover) {
                this._oProfilePopover = new Popover({
                    showHeader: false,
                    placement: "Bottom",
                    contentWidth: "300px",
                    content: [
                        new VBox({
                            class: "sapUiSmallMargin"
                        }).addItem(
                            new HBox({ alignItems: "Center", class: "sapUiMediumMarginBottom" })
                                .addItem(new Avatar({ initials: "MR", backgroundColor: "Accent6", displaySize: "M", class: "sapUiSmallMarginEnd" }))
                                .addItem(new VBox()
                                    .addItem(new Title({ text: "Marcus Reinholt", level: "H5" }))
                                    .addItem(new Text({ text: "Basis Administrator" }).addStyleClass("sapUiSmallText"))
                                    .addItem(new Text({ text: "marcus.reinholt@company.com" }).addStyleClass("sapUiSmallText"))
                                )
                        ).addItem(
                            new HBox({ class: "sapUiSmallMarginBottom" })
                                .addItem(new ObjectStatus({ text: "Sentinel Admin", state: "Information", icon: "sap-icon://role", class: "sapUiSmallMarginEnd" }))
                                .addItem(new ObjectStatus({ text: "PRD Connected", state: "Success", icon: "sap-icon://connected" }))
                        ).addItem(
                            new HBox({ class: "sapUiSmallMarginBottom" })
                                .addItem(new Icon({ src: "sap-icon://time-account", class: "sapUiSmallMarginEnd" }))
                                .addItem(new Text({ text: "Session started 2h ago" }).addStyleClass("sapUiSmallText"))
                        ).addItem(
                            new Button({
                                text: "Settings",
                                icon: "sap-icon://settings",
                                width: "100%",
                                class: "sapUiSmallMarginBottom",
                                press: function () {
                                    that._oProfilePopover.close();
                                    that.navTo("settings");
                                }
                            })
                        ).addItem(
                            new Button({
                                text: "Sign Out",
                                icon: "sap-icon://log",
                                width: "100%",
                                type: "Reject",
                                press: function () {
                                    that._oProfilePopover.close();
                                    MessageToast.show("Signing out...");
                                }
                            })
                        )
                    ]
                });
                this.getView().addDependent(this._oProfilePopover);
            }
            this._oProfilePopover.openBy(oEvent.getSource());
        },

        // ── Co-pilot ─────────────────────────────────────────────────────────
        onOpenCopilot: function () {
            if (!this._oCopilotDialog) {
                this._buildCopilotDialog();
            }
            this._copilotHistory = [];
            this._copilotMessages = [];
            this._renderMessages([{
                role: "assistant",
                html: "Hi Marcus \uD83D\uDC4B I'm grounded on <strong>SC-2026-031</strong>. You have <strong style='color:#bb0000'>18 open violations</strong> and a system risk score of <strong>78</strong>. What would you like to know?"
            }]);
            this._oCopilotDialog.open();
        },

        _buildCopilotDialog: function () {
            var that = this;

            this._oMsgContainer = new VBox({ width: "100%" }).addStyleClass("sapUiSmallMargin");
            var oScroll = new ScrollContainer({
                vertical: true, horizontal: false,
                height: "380px", width: "100%",
                content: [this._oMsgContainer]
            });

            // Suggestion buttons
            var oSuggBox = new HBox({ wrap: "Wrap", class: "sapUiSmallMarginBeginEnd sapUiTinyMarginBottom" });
            [
                "Summarize today's scan",
                "Prioritize violations",
                "Why is JKOWAL high risk?",
                "Remediate SAP_ALL",
                "What changed?"
            ].forEach(function (sText) {
                oSuggBox.addItem(new Button({
                    text: sText,
                    press: function () { that._sendMessage(sText); }
                }).addStyleClass("sentinelSuggBtn sapUiSmallMarginEnd sapUiTinyMarginBottom"));
            });

            this._oCopilotInput = new Input({
                placeholder: "Ask about violations, users, risks...",
                width: "88%",
                submit: function () { that._onSend(); }
            });

            this._oCopilotDialog = new Dialog({
                resizable: true,
                draggable: true,
                contentWidth: "540px",
                contentHeight: "580px",
                verticalScrolling: false,
                customHeader: new Bar({
                    contentLeft: [
                        new Icon({ src: "sap-icon://ai", color: "Highlight" }),
                        new Title({ text: "  Risk Co-pilot", level: "H5" })
                    ],
                    contentMiddle: [
                        new ObjectStatus({ text: "SC-2026-031", state: "Success", icon: "sap-icon://connected" })
                    ],
                    contentRight: [
                        new Button({ icon: "sap-icon://delete", type: "Transparent", tooltip: "Clear", press: function () { that._clearChat(); } }),
                        new Button({ icon: "sap-icon://decline", type: "Transparent", tooltip: "Close", press: function () { that._oCopilotDialog.close(); } })
                    ]
                }),
                content: [oScroll, oSuggBox],
                footer: new Bar({
                    contentMiddle: [
                        this._oCopilotInput,
                        new Button({
                            icon: "sap-icon://paper-plane",
                            type: "Emphasized",
                            class: "sapUiSmallMarginBegin",
                            press: function () { that._onSend(); }
                        })
                    ]
                }),
                buttons: []
            });
            this.getView().addDependent(this._oCopilotDialog);
        },

        _clearChat: function () {
            this._copilotHistory = [];
            this._copilotMessages = [];
            this._renderMessages([{
                role: "assistant",
                html: "Chat cleared. How can I help with your SAP security posture?"
            }]);
        },

        _onSend: function () {
            var sText = this._oCopilotInput ? this._oCopilotInput.getValue().trim() : "";
            if (!sText) return;
            this._oCopilotInput.setValue("");
            this._sendMessage(sText);
        },

        _sendMessage: function (sText) {
            this._copilotMessages.push({ role: "user", html: this._esc(sText) });
            this._copilotMessages.push({ role: "assistant", html: "<em style='color:#888'>Thinking\u2026</em>" });
            this._renderMessages(this._copilotMessages);

            var aHistory = this._copilotHistory.slice(-8);

            CopilotService.sendMessage(sText, aHistory)
                .then(function (sReply) {
                    this._copilotHistory.push({ role: "user", content: sText });
                    this._copilotHistory.push({ role: "assistant", content: sReply });
                    this._copilotMessages.pop();
                    this._copilotMessages.push({ role: "assistant", html: this._mdToHtml(sReply) });
                    this._renderMessages(this._copilotMessages);
                }.bind(this))
                .catch(function () {
                    this._copilotMessages.pop();
                    this._copilotMessages.push({ role: "assistant", html: "<span style='color:#bb0000'>Connection error. Please try again.</span>" });
                    this._renderMessages(this._copilotMessages);
                }.bind(this));
        },

        _renderMessages: function (aMessages) {
            if (!this._oMsgContainer) return;
            this._oMsgContainer.destroyItems();
            aMessages.forEach(function (oMsg) {
                var bUser = oMsg.role === "user";
                var oRow = new HBox({
                    justifyContent: bUser ? "End" : "Start",
                    class: "sapUiSmallMarginBottom"
                });
                if (!bUser) {
                    oRow.addItem(new Icon({ src: "sap-icon://ai", color: "Highlight", size: "1rem", class: "sapUiSmallMarginEnd sapUiTinyMarginTop" }));
                }
                var oBubble = new VBox({ class: bUser ? "sentinelUserBubble" : "sentinelBotBubble" });
                oBubble.addItem(new FormattedText({ htmlText: oMsg.html || "" }));
                oRow.addItem(oBubble);
                this._oMsgContainer.addItem(oRow);
            }.bind(this));
        },

        _esc: function (s) {
            return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        },

        _mdToHtml: function (s) {
            return this._esc(s)
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                .replace(/`([^`]+)`/g, "<code style='background:#f5f5f5;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:0.85em'>$1</code>")
                .replace(/^\s*[-\u2022]\s+(.+)$/gm, "\u2022 $1<br/>")
                .replace(/^\s*\d+\.\s+(.+)$/gm, "$1<br/>")
                .replace(/\n\n/g, "<br/><br/>")
                .replace(/\n/g, "<br/>");
        }
    });
});
