import {SettingsWidgetWrapper} from "./components/tsclient/SettingsWidgetWrapper";
import {ToggleSetting} from "./components/tsclient/ToggleSetting";
import {Settings} from "./helpers/Settings";
import {Tooltips} from "./helpers/Tooltips";
import {
    findNextMessage,
    findOwnMessages,
    findPreviousMessage,
    getActiveConnection,
    getVueInstance,
    setChatInput
} from "./helpers/Util";
import {Attachments} from "./messages/Attachments";
import {Parser} from "./messages/parser/Parser";
import {MessageRenderer} from "./messages/render/MessageRenderer";
import {ChatInputContainer, Message, VirtualListItem} from "./types/TSClient";

const settings = new Settings("betterchat", {
    "enabled": true,
    "chatStyling": true,
    "embeds": true,
});

function modifyMessageNode(node: HTMLElement) {
    if (node.classList.contains("ts-chat-message-system-body-contents")) {
        return;
    }
    for (const childNode of node.childNodes) {
        if ((<HTMLElement>childNode).tagName == "SPAN" && (<HTMLElement>childNode).classList.contains("ts-parsed-text-content-emoji")) {
            return;
        }
    }
    if (settings.getValueForKey("chatStyling")) {
        const document = Parser.parse(node);
        const html = MessageRenderer.render(document);
        while (node.firstChild) {
            node.removeChild(<Node>node.lastChild);
        }
        node.appendChild(html);
    }
    if (settings.getValueForKey("embeds") && !node.classList.contains("ts-reply-original") && !node.classList.contains("ts-reply-shortened")) {
        const links = Array.from(node.parentElement!!.querySelectorAll("a"))
            .map(link => link.href);
        Attachments.parse(links)
            .then((attachments) => onAttachmentsGenerated(node, attachments))
            .finally(() => { onMessageHeightChanged(node) });
    } else {
        onMessageHeightChanged(node);
    }
    node.dataset.parsed = "true";
}

function onAttachmentsGenerated(node: HTMLElement, attachments: HTMLElement[]) {
    if (attachments.length > 0) {
        const renderedMessage = node.closest("div.ts-rendered-message")!!;
        let container = renderedMessage.querySelector("div.ts-chat-message-attachment-container");
        if (container == null) {
            container = document.createElement("div");
            container.classList.add("ts-chat-message-attachment-container", "ts-chat-message-attachments", "ts-timestamp-margin-left");
            const chatRoomEventBody = renderedMessage.querySelector("div.ts-chat-room-event-body");
            if (chatRoomEventBody != null) {
                const tsvFlex = document.createElement("div");
                tsvFlex.classList.add("tsv-flex");
                tsvFlex.appendChild(container);
                chatRoomEventBody.appendChild(tsvFlex);
            } else {
                node.parentNode!!.insertBefore(container, node.nextSibling);
            }
        }
        for (const attachment of attachments) {
            const inner = document.createElement("div");
            inner.classList.add("ts-chat-message-attachment-inner");
            inner.appendChild(attachment);
            const outer = document.createElement("div");
            outer.classList.add("ts-chat-message-attachment");
            outer.appendChild(inner);
            container.appendChild(outer);
        }
    }
}

function removeAttachments(node: Element) {
    for (const attachment of node.querySelectorAll(".ts-chat-message-attachment-container")) {
        attachment.remove();
    }
    onMessageHeightChanged(node);
}

function onMessageHeightChanged(node: Element) {
    (<VirtualListItem | null>getVueInstance(node.closest("div.tsv-virtual-list-item")))?.onItemChanged();
}

namespace EventHandler {
    export function onMessageAdded(node: Node) {
        try {
            if (node.nodeType == Node.ELEMENT_NODE && settings.getValueForKey("enabled")) {
                const element = <Element>node;
                const messageNodes = element.querySelectorAll(".ts-chat-message-content.ts-parsed-text-content");
                for (const messageNode of messageNodes) {
                    if (!isModifiedMessageNode(<HTMLElement>messageNode)) {
                        modifyMessageNode(<HTMLElement>messageNode);
                    }
                }
                if (getVueInstance(element)?.isRedacted) {
                    removeAttachments(element);
                }
            }
        } catch (e) {
            return;
        }
    }

    export function onMessageRemoved(chatMessageContent: HTMLElement, previousSibling: HTMLElement) {
        if (isModifiedMessageNode(chatMessageContent)) {
            Tooltips.destroy(chatMessageContent, true);
            const renderedMessage = previousSibling.closest(".ts-rendered-message");
            if (renderedMessage != null) {
                removeAttachments(renderedMessage);
            }
        }
    }

    export function onChatSettingsAdded() {
        const root = document.querySelector("div.ts-appearance-settings div.ts-widget-container");
        if (root == null) {
            return;
        }
        const widgetWrapper = SettingsWidgetWrapper(
            "BetterChat",
            ToggleSetting("Enable BetterChat", "Enables advanced chat features", "enabled", settings),
            ToggleSetting("Rich Embeds", "Load rich embeds for links in chat messages", "embeds", settings),
            ToggleSetting("BBCode support", "Support BBCode styling for chat messages", "chatStyling", settings),
        );
        root.appendChild(widgetWrapper);
    }

    export function onChatInputAdded(node: HTMLElement) {
        if (!settings.getValueForKey("enabled")) {
            return;
        }
        let prevConnectionId: string | null = null;
        let prevMessage: Message | null = null;
        node.addEventListener("keydown", (event: KeyboardEvent) => {
            const activeConnection = getActiveConnection();
            if (activeConnection == null) {
                return;
            }
            if (prevConnectionId != activeConnection.id) {
                prevConnectionId = activeConnection.id;
                prevMessage = null;
            }
            const ownID = activeConnection.activeDetailItem.chat.identity;
            const chatInputContainer: ChatInputContainer = getVueInstance(node.closest("div.ts-chat-input-container"));
            const currentText = chatInputContainer?.actualMsg;
            if (event.key === "ArrowUp" && (currentText?.length == 0 || currentText == prevMessage?.original)) {
                const messages = findOwnMessages(activeConnection, ownID);
                const message = findNextMessage(prevMessage, messages);
                if (message != null) {
                    setChatInput(message, chatInputContainer);
                    prevMessage = message;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
            } else if (event.key === "ArrowDown" && currentText == prevMessage?.original) {
                const messages = findOwnMessages(activeConnection, ownID);
                const message = findPreviousMessage(prevMessage, messages);
                setChatInput(message, chatInputContainer);
                prevMessage = message;
                event.preventDefault();
                event.stopImmediatePropagation();
            } else if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
                prevMessage = null;
            }
        });
    }

    export function onViewRemoved() {
        Tooltips.destroyAll();
    }

    function isModifiedMessageNode(node: HTMLElement): string | undefined {
        return node.dataset.parsed;
    }
}

namespace DocumentObserver {
    const observer = new MutationObserver((mutations: MutationRecord[]) => {
        for (const mutation of mutations) {
            if (mutation.type == "childList") {
                for (const node of mutation.removedNodes) {
                    onNodeRemoved(node, mutation);
                }
                for (const node of mutation.addedNodes) {
                    onNodeAdded(node);
                }
            }
        }
    });

    function onNodeRemoved(node: Node, mutation: MutationRecord) {
        if (node.nodeType == Node.ELEMENT_NODE) {
            const element = <HTMLElement>node;
            if (element.tagName == "DIV" && element.classList.contains("tsv-view") && element.classList.contains("tsv-item-view") && element.classList.contains("tsv-view-transparent")) {
                EventHandler.onViewRemoved();
            } else if (element.tagName == "SPAN" && element.classList.contains("ts-chat-message-content") && element.classList.contains("ts-parsed-text-content")) {
                EventHandler.onMessageRemoved(element, <HTMLElement>mutation.previousSibling);
            }
        }
    }

    function onNodeAdded(node: Node) {
        if (node.nodeType == Node.ELEMENT_NODE && (<HTMLElement>node).tagName == "DIV") {
            const element = <HTMLElement>node;
            if (element.classList.contains("ts-rendered-message")) {
                EventHandler.onMessageAdded(element);
            } else if (element.classList.contains("tsv-virtual-list-item")) {
                const renderedMessage = element.querySelector(".ts-rendered-message");
                if (renderedMessage != null) {
                    EventHandler.onMessageAdded(renderedMessage);
                }
            } else if (element.classList.contains("ts-appearance-settings")) {
                const chatSettingsIcon = document.querySelector("div.tsv-settings div.tsv-settings-categories .tsv-selected svg.tsv-icon-settings-chat");
                if (chatSettingsIcon != null) {
                    EventHandler.onChatSettingsAdded();
                }
            } else if (element.classList.contains("ProseMirror")) {
                EventHandler.onChatInputAdded(element);
            }
        }
    }

    export function observe(node: HTMLElement) {
        observer.observe(node, {
            childList: true,
            attributes: false,
            characterData: false,
            subtree: true,
        });
    }
}

settings.populateSettings(() => {
    DocumentObserver.observe(document.body);
});
