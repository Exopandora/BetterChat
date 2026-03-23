import {parseMessage} from "./messages/MessageParser";
import {tippyDefaultProps, tooltipManager} from "./util/Tooltips";
import {generateHtml} from "./messages/MessageGenerator";
import {createAttachments} from "./attachments/AttachmentGenerator";
import {Settings} from "./util/Settings";

declare var tippy: any

type Sender = {
    uid: string;
    isQueryClient: boolean;
}

type Message = {
    id: string;
    original: string;
    isSystem: boolean;
    sender: Sender | null;
}

type Connection = {
    id: string;
    activeDetailItem: ActiveDetailItem;
}

type ActiveDetailItem = {
    chat: Chat;
}

type Chat = {
    identity: string;
    messages: Message[];
    is_active: boolean;
    isVisible: boolean;
}

const settings = new Settings();

function onMessageHeightChanged(node: Element) {
    const virtualListItem = node.closest("div.tsv-virtual-list-item");
    if(virtualListItem != null && (<any> virtualListItem).__vue__) {
        (<any> virtualListItem).__vue__.onItemChanged();
    }
}

function modifyMessageNode(node: HTMLElement) {
    if(node.classList.contains("ts-chat-message-system-body-contents")) {
        return;
    }
    for(const childNode of node.childNodes) {
        if((<HTMLElement> childNode).tagName == "SPAN" && (<HTMLElement> childNode).classList.contains("ts-parsed-text-content-emoji")) {
            return;
        }
    }
    if(settings.getValueForKey("chatStyling")) {
        const { message, emojis, bbSections } = parseMessage(node);
        const htmlElements = generateHtml(message, emojis, bbSections);
        while(node.firstChild) {
            node.removeChild(<Node> node.lastChild);
        }
        for(const htmlElement of htmlElements) {
            node.appendChild(htmlElement);
        }
    }
    if(settings.getValueForKey("embeds") && !node.classList.contains("ts-reply-original") && !node.classList.contains("ts-reply-shortened")) {
        const links = Array.from(node.parentElement!!.querySelectorAll("a")).map(link => link.href);
        createAttachments(links).then(attachments => {
            if(attachments.length > 0) {
                const renderedMessage = node.closest("div.ts-rendered-message")!!;
                let container = renderedMessage.querySelector("div.ts-chat-message-attachment-container");
                if(container == null) {
                    container = document.createElement("div");
                    container.classList.add("ts-chat-message-attachment-container", "ts-chat-message-attachments", "ts-timestamp-margin-left");
                    const chatRoomEventBody = renderedMessage.querySelector("div.ts-chat-room-event-body");
                    if(chatRoomEventBody != null) {
                        const tsvflex = document.createElement("div");
                        tsvflex.classList.add("tsv-flex");
                        tsvflex.appendChild(container);
                        chatRoomEventBody.appendChild(tsvflex);
                    } else {
                        node.parentNode!!.insertBefore(container, node.nextSibling);
                    }
                }
                for(const attachment of attachments) {
                    const inner = document.createElement("div");
                    inner.classList.add("ts-chat-message-attachment-inner");
                    inner.appendChild(attachment);
                    const outer = document.createElement("div");
                    outer.classList.add("ts-chat-message-attachment");
                    outer.appendChild(inner);
                    container.appendChild(outer);
                }
            }
        }).then(() => {
            onMessageHeightChanged(node);
        });
    } else {
        onMessageHeightChanged(node);
    }
    node.dataset.parsed = "true";
}

function removeAttachments(node: Element) {
    for(const attachment of node.querySelectorAll(".ts-chat-message-attachment-container")) {
        attachment.remove();
    }
    onMessageHeightChanged(node);
}

function isModifiedMessageNode(node: HTMLElement): string | undefined {
    return node.dataset.parsed;
}

function createSettingsCategoryHeader(name: string): HTMLElement {
    const title = document.createElement("div");
    title.classList.add("title");
    title.innerText = name;
    const header = document.createElement("div");
    header.classList.add("ts-widget-section-header");
    header.appendChild(title);
    return header;
}

function createSettingsWidgetWrapper(): HTMLElement {
    const widgetWrapper = document.createElement("div");
    widgetWrapper.classList.add("ts-widget-wrapper");
    return widgetWrapper;
}

function createSettingsCardWidget(): HTMLElement {
    const content = document.createElement("div");
    content.classList.add("ts-card", "ts-widget", "full");
    return content;
}

function createToggleSetting(title: string, description: string, configKey: string): HTMLElement {
    const titleSpan = document.createElement("span");
    titleSpan.innerText = title;
    const descriptionP = document.createElement("p");
    descriptionP.classList.add("ts-card-subtitle");
    descriptionP.innerText = description;
    const label = document.createElement("label");
    label.classList.add("tsv-flex-column");
    label.setAttribute("for", "ts-toggle-4");
    label.appendChild(titleSpan);
    label.appendChild(descriptionP);
    const input = document.createElement("input");
    input.type = "checkbox";
    const toggleInner = document.createElement("div");
    toggleInner.classList.add("ts-toggle-inner", "visible");
    toggleInner.appendChild(input);
    const toggle = document.createElement("div");
    toggle.classList.add("ts-toggle", "visible");
    const updateToggle = (enabled: boolean) => {
        if(enabled) {
            toggle.classList.add("checked");
            toggleInner.classList.add("checked");
        } else if(toggle.classList.contains("checked")) {
            toggle.classList.remove("checked");
            toggleInner.classList.remove("checked");
        }
    };
    updateToggle(settings.getValueForKey(configKey));
    toggle.appendChild(toggleInner);
    const toggleWrapper = document.createElement("div");
    toggleWrapper.classList.add("ts-toggle-wrapper", "ts-flex", "row");
    toggleWrapper.onclick = () => {
        const enabled = !settings.getValueForKey(configKey);
        settings.setValueForKey(configKey, enabled);
        updateToggle(enabled);
    };
    toggleWrapper.appendChild(label);
    toggleWrapper.appendChild(toggle);
    const container = document.createElement("div");
    container.classList.add("ts-card-setting-container");
    container.appendChild(toggleWrapper);
    return container;
}

function appendSettingsToView() {
    const root = document.querySelector("div.ts-appearance-settings div.ts-widget-container");
    if(root == null) {
        return;
    }
    const settingsHeader = createSettingsCategoryHeader("BetterChat");
    const cardWidget = createSettingsCardWidget();
    cardWidget.appendChild(createToggleSetting("Enable BetterChat", "Enables advanced chat features", "enabled"));
    cardWidget.appendChild(createToggleSetting("Rich Embeds", "Load rich embeds for links in chat messages", "embeds"));
    cardWidget.appendChild(createToggleSetting("BBCode support", "Support BBCode styling for chat messages", "chatStyling"));
    const widgetWrapper = createSettingsWidgetWrapper();
    widgetWrapper.appendChild(settingsHeader);
    widgetWrapper.appendChild(cardWidget);
    root.appendChild(widgetWrapper);
}

function findActiveConnection(connections: Connection[]): Connection | null {
    for(const connection of connections) {
        if(connection.activeDetailItem?.chat.isVisible && connection.activeDetailItem?.chat.is_active) {
            return connection;
        }
    }
    return null;
}

function findOwnMessages(connection: Connection, ownID: string): Message[] {
    return connection.activeDetailItem.chat.messages
        .filter(message => message.sender?.uid == ownID && !message.sender.isQueryClient && !message.isSystem)
        .reverse();
}

function findNextMessage(prevMessage: Message, messages: Message[]): Message | null {
    if(prevMessage == null) {
        return messages[0];
    }
    const index = messages.findIndex(message => message.id == prevMessage.id);
    if(index < 0 || index == messages.length - 1) {
        return null;
    }
    return messages[index + 1];
}

function findPrevMessage(prevMessage: Message, messages: Message[]): Message | null {
    if(prevMessage == null) {
        return null;
    }
    const index = messages.findIndex(message => message.id == prevMessage.id);
    if(index > 0 && index < messages.length) {
        return messages[index - 1];
    }
    return null;
}

function setChatInputText(message: any, chatInputContainer: any) {
    chatInputContainer.clearContent();
    if(message != null) {
        chatInputContainer.insertUnparsedContent(message.original);
    }
}

function onChatInputAdded(node: HTMLElement) {
    if(!settings.getValueForKey("enabled")) {
        return;
    }
    const appController = (<any> document.body.querySelector("#app")).__vue__.appController;
    let prevConnectionId: any = null;
    let prevMessage: any = null;
    node.addEventListener("keydown", (event: KeyboardEvent) => {
        const activeConnection = findActiveConnection(appController.connections);
        if(activeConnection == null) {
            return;
        }
        if(prevConnectionId != activeConnection.id) {
            prevConnectionId = activeConnection.id;
            prevMessage = null;
        }
        const ownID = activeConnection.activeDetailItem.chat.identity;
        const chatInputContainer = (<any> node.closest("div.ts-chat-input-container"))?.__vue__
        const currentText = chatInputContainer?.actualMsg;
        if(event.key === "ArrowUp" && (currentText?.length == 0 || currentText == prevMessage?.original)) {
            const messages = findOwnMessages(activeConnection, ownID);
            const message = findNextMessage(prevMessage, messages);
            if(message != null) {
                setChatInputText(message, chatInputContainer);
                prevMessage = message;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
        } else if(event.key === "ArrowDown" && currentText == prevMessage?.original) {
            const messages = findOwnMessages(activeConnection, ownID);
            const message = findPrevMessage(prevMessage, messages);
            setChatInputText(message, chatInputContainer);
            prevMessage = message;
            event.preventDefault();
            event.stopImmediatePropagation();
        } else if(event.key !== "ArrowUp" && event.key !== "ArrowDown") {
            prevMessage = null;
        }
    });
}

function onMessageAdded(node: Node) {
    try {
        if(node instanceof Element && settings.getValueForKey("enabled")) {
            const messages = node.querySelectorAll(".ts-chat-message-content.ts-parsed-text-content");
            for(const message of messages) {
                if(!isModifiedMessageNode(<HTMLElement> message)) {
                    modifyMessageNode(<HTMLElement> message);
                }
            }
            if((<any> node)?.__vue__?.isRedacted) {
                removeAttachments(node);
            }
        }
    } catch(e) {
        return;
    }
}

function onMessageRemoved(chatMessageContent: HTMLElement, previousSibling: HTMLElement) {
    if(isModifiedMessageNode(chatMessageContent)) {
        tooltipManager.destroyTooltip(chatMessageContent, true);
        const renderedMessage = previousSibling.closest(".ts-rendered-message");
        if(renderedMessage != null) {
            removeAttachments(renderedMessage);
        }
    }
}

const documentObserver = {
    observer: new MutationObserver((mutations: MutationRecord[], _: MutationObserver) => {
        for(const mutation of mutations) {
            if(mutation.type == "childList") {
                for(const node of mutation.removedNodes) {
                    if(node.nodeType == Node.ELEMENT_NODE) {
                        const element = <HTMLElement> node
                        if(element.tagName == "DIV" && element.classList.contains("tsv-view") && element.classList.contains("tsv-item-view") && element.classList.contains("tsv-view-transparent")) {
                            tooltipManager.destroyAll();
                        } else if(element.tagName == "SPAN" && element.classList.contains("ts-chat-message-content") && element.classList.contains("ts-parsed-text-content")) {
                            onMessageRemoved(element, <HTMLElement> mutation.previousSibling);
                        }
                    }
                }
                for(const node of mutation.addedNodes) {
                    if(node.nodeType == Node.ELEMENT_NODE && (<HTMLElement> node).tagName == "DIV") {
                        const element = <HTMLElement> node
                        if(element.classList.contains("ts-rendered-message")) {
                            onMessageAdded(element);
                        } else if(element.classList.contains("tsv-virtual-list-item")) {
                            const renderedMessage = element.querySelector(".ts-rendered-message");
                            if(renderedMessage) {
                                onMessageAdded(renderedMessage);
                            }
                        } else if(element.classList.contains("ts-appearance-settings")) {
                            const chatSettingsIcon = document.querySelector("div.tsv-settings div.tsv-settings-categories .tsv-selected svg.tsv-icon-settings-chat");
                            if(chatSettingsIcon != null) {
                                appendSettingsToView();
                            }
                        } else if(element.classList.contains("ProseMirror")) {
                            onChatInputAdded(element);
                        }
                    }
                }
            }
        }
    }),
    observe(node: HTMLElement) {
        this.observer.observe(node, {
            childList: true,
            attributes: false,
            characterData: false,
            subtree: true
        });
    }
};

settings.populateSettings(() => {
    tippy.setDefaultProps(tippyDefaultProps);
    documentObserver.observe(document.body);
});
