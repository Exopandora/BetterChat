import {AppController, ChatInputContainer, Connection, Message} from "../types/TSClient";

export function getAppController(): AppController {
    return getApp()?.appController;
}

function getApp(): any {
    return getVueInstance(document.body.querySelector("#app"));
}

export function getVueInstance(node: Node | null): any {
    return (node as any)?.__vue__
}

export function findOwnMessages(connection: Connection, ownID: string): Message[] {
    return connection.activeDetailItem.chat.messages
        .filter(message => message.sender?.uid == ownID && !message.sender.isQueryClient && !message.isSystem)
        .reverse();
}

export function findNextMessage(prevMessage: Message | null, messages: Message[]): Message | null {
    if (prevMessage == null) {
        return messages[0];
    }
    const index = messages.findIndex(message => message.id == prevMessage.id);
    if (index < 0 || index == messages.length - 1) {
        return null;
    }
    return messages[index + 1];
}

export function findPreviousMessage(prevMessage: Message | null, messages: Message[]): Message | null {
    if (prevMessage == null) {
        return null;
    }
    const index = messages.findIndex(message => message.id == prevMessage.id);
    if (index > 0 && index < messages.length) {
        return messages[index - 1];
    }
    return null;
}

export function setChatInput(message: Message | null, chatInputContainer: ChatInputContainer) {
    chatInputContainer.clearContent();
    if (message != null) {
        chatInputContainer.insertUnparsedContent(message.original);
    }
}

export function getActiveConnection(): Connection | null {
    for (const connection of getAppController().connections) {
        if (connection.activeDetailItem?.chat.isVisible && connection.activeDetailItem?.chat.is_active) {
            return connection;
        }
    }
    return null;
}

export function truncateString(string: string, size: number): string {
    if (string.length > size) {
        return string.substring(0, Math.max(0, size - 3)) + "...";
    }
    return string;
}

export function openImagePreview(
    url: string,
    alt: string | null = null,
    title: string | null = null,
): void {
    getAppController().events.onInvokeLightboxEmitter.fire({
        invocation: {
            url: url,
            thumbnailUrl: "",
            contentType: "image",
            contentSize: null,
            footerActions: [],
            headerLabel: "",
            bodyLabel: "",
            interactive: {
                kind: "image",
                src: url,
                alt: alt || "",
                title: title || void 0,
            },
        },
    });
}

export function translate(key: string, options: { [key: string]: any } = {}): string {
    return getApp()._vm._i18n.t(key, options);
}
