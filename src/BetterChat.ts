import {SettingsWidget} from "./components/tsclient/SettingsWidget";
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
import {Tokenizer} from "./messages/parser/Tokenizer";
import {MessageRenderer} from "./messages/render/MessageRenderer";
import {ChatInputContainer, Message} from "./types/TSClient";

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
        if ((childNode as HTMLElement).tagName == "SPAN" && (childNode as HTMLElement).classList.contains("ts-parsed-text-content-emoji")) {
            return;
        }
    }
    if (settings.getValueForKey("chatStyling")) {
        const tokens = Tokenizer.tokenizeString(getVueInstance(node)._props.data);
        if (tokens.length > 1) {
            const document = Parser.parse(tokens);
            const html = MessageRenderer.render(document);
            while (node.firstChild) {
                node.removeChild(node.lastChild as Node);
            }
            if (html.dataset.renderFullWidth === "true") {
                const bubble = node.closest(".ts-chat-room-event-detailed .ts-chat-room-event-bubble") as (HTMLElement | null);
                if (bubble != null) {
                    bubble.style.flexGrow = "1";
                }
                node.style.flexGrow = "1";
                html.style.flexBasis = "100%";
                delete html.dataset.renderFullWidth;
            }
            node.appendChild(html);
        }
    }
    if (settings.getValueForKey("embeds") && !node.classList.contains("ts-reply-original") && !node.classList.contains("ts-reply-shortened")) {
        const dataIdx = (node.closest(".tsv-virtual-list-item") as HTMLElement)?.dataset?.idx;
        if (dataIdx == null || dataIdx == "-1") {
            return;
        }
        const links = Array.from(node.parentElement!!.querySelectorAll("a"))
            .map(link => link.href);
        Attachments.parse(links)
            .then((attachments) => {
                const current = (node.closest(".tsv-virtual-list-item") as HTMLElement)?.dataset?.idx;
                if (current != null && current == dataIdx) {
                    onAttachmentsGenerated(node, attachments);
                }
            });
    }
}

function onAttachmentsGenerated(node: HTMLElement, attachments: HTMLElement[]) {
    if (attachments.length > 0) {
        const renderedMessage = node.closest("div.ts-rendered-message");
        if (renderedMessage == null) {
            return;
        }
        let container = renderedMessage.querySelector("div.ts-chat-message-attachment-container");
        if (container == null) {
            container = document.createElement("div");
            container.classList.add("ts-chat-message-attachment-container", "ts-chat-message-attachments", "ts-timestamp-margin-left", "betterchat-attachment-container");
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
            outer.classList.add("ts-chat-message-attachment", "betterchat-message-attachment");
            outer.appendChild(inner);
            container.appendChild(outer);
        }
    }
}

function removeBetterChatAttachments(node: Element) {
    for (const attachment of node.querySelectorAll(".ts-chat-message-attachment.betterchat-message-attachment")) {
        attachment.remove();
    }
    for (const attachment of node.querySelectorAll(".ts-chat-message-attachment-container.betterchat-attachment-container")) {
        attachment.remove();
    }
}

namespace EventHandler {
    export function onMessageAdded(node: Node) {
        try {
            if (node.nodeType == Node.ELEMENT_NODE && settings.getValueForKey("enabled")) {
                const element = node as Element;
                removeBetterChatAttachments(element);
                const messageNodes = element.querySelectorAll(".ts-chat-message-content.ts-parsed-text-content");
                for (const messageNode of messageNodes) {
                    modifyMessageNode(messageNode as HTMLElement);
                }
                if (getVueInstance(element)?.isRedacted) {
                    removeBetterChatAttachments(element);
                }
            }
        } catch (e) {
            return;
        }
    }

    export function onMessageRemoved(chatMessageContent: HTMLElement, previousSibling: HTMLElement) {
        Tooltips.destroy(chatMessageContent, true);
        const renderedMessage = previousSibling.closest(".ts-rendered-message");
        if (renderedMessage != null) {
            removeBetterChatAttachments(renderedMessage);
        }
    }

    export function onChatSettingsAdded(element: HTMLElement) {
        const root = element.querySelector("div.ts-widget-container");
        if (root == null) {
            return;
        }
        const widgetWrapper = SettingsWidget("BetterChat", [
            ToggleSetting("Enable BetterChat", "Enables advanced chat features", "enabled", settings),
            ToggleSetting("Rich Embeds", "Load rich embeds for links in chat messages", "embeds", settings),
            ToggleSetting("BBCode support", "Support BBCode styling for chat messages", "chatStyling", settings),
        ]);
        root.appendChild(widgetWrapper);
    }

    export function onChatInputContentAdded(chatInputContent: HTMLElement) {
        if (!settings.getValueForKey("enabled")) {
            return;
        }
        let prevConnectionId: string | null = null;
        let prevMessage: Message | null = null;
        chatInputContent.addEventListener("keydown", (event: KeyboardEvent) => {
            const activeConnection = getActiveConnection();
            if (activeConnection == null) {
                return;
            }
            if (prevConnectionId != activeConnection.id) {
                prevConnectionId = activeConnection.id;
                prevMessage = null;
            }
            const ownID = activeConnection.activeDetailItem.chat.identity;
            const chatInputContainer: ChatInputContainer = getVueInstance(chatInputContent.closest("div.ts-chat-input-container"));
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

    const virtualListItemObserver = new MutationObserver((mutations: MutationRecord[]) => {
        for (const mutation of mutations) {
            if (mutation.type == "attributes" && mutation.attributeName == "data-idx") {
                const renderedMessage = (mutation.target as HTMLElement).querySelector(".ts-rendered-message");
                if (renderedMessage != null) {
                    EventHandler.onMessageAdded(renderedMessage);
                }
            }
        }
    });

    export function onViewRemoved() {
        Tooltips.destroyAll();
        virtualListItemObserver.disconnect();
    }

    export function onListItemAdded(element: HTMLElement) {
        virtualListItemObserver.observe(element, {
            attributes: true,
        });
        const renderedMessage = element.querySelector(".ts-rendered-message");
        if (renderedMessage != null) {
            EventHandler.onMessageAdded(renderedMessage);
        }
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
            const element = node as HTMLElement;
            if (element.tagName == "DIV" && element.classList.contains("tsv-view") && element.classList.contains("tsv-item-view") && element.classList.contains("tsv-view-transparent")) {
                EventHandler.onViewRemoved();
            } else if (element.tagName == "SPAN" && element.classList.contains("ts-chat-message-content") && element.classList.contains("ts-parsed-text-content")) {
                EventHandler.onMessageRemoved(element, mutation.previousSibling as HTMLElement);
            }
        }
    }

    function onNodeAdded(node: Node) {
        if (node.nodeType == Node.ELEMENT_NODE && (node as HTMLElement).tagName == "DIV") {
            const element = node as HTMLElement;
            if (element.classList.contains("tsv-virtual-list-item")) {
                EventHandler.onListItemAdded(element);
            } else if (element.classList.contains("ts-appearance-settings")) {
                const chatSettingsIcon = document.querySelector("div.tsv-settings div.tsv-settings-categories .tsv-selected svg.tsv-icon-settings-chat");
                if (chatSettingsIcon != null) {
                    EventHandler.onChatSettingsAdded(element);
                }
            } else if (element.classList.contains("ts-chat-input-container-content")) {
                EventHandler.onChatInputContentAdded(element);
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
