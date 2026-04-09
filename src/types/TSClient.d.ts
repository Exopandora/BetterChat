export type Sender = {
    uid: string;
    isQueryClient: boolean;
}

export type Message = {
    id: string;
    original: string;
    isSystem: boolean;
    sender: Sender | null;
}

export type Connection = {
    id: string;
    activeDetailItem: ActiveDetailItem;
}

export type ActiveDetailItem = {
    chat: Chat;
}

export type Chat = {
    identity: string;
    messages: Message[];
    is_active: boolean;
    isVisible: boolean;
}

export type ChatInputContainer = {
    actualMsg: string;
    clearContent(): void;
    insertUnparsedContent(content: string): void;
}

export type VirtualListItem = {
    onItemChanged(): void;
}

export type AppController = {
    connections: Connection[];
}

type TSClientInternal = {
    saveJsonBlob(id: string, blob: string): void;
    getJsonBlob(id: string, callback: (error: any, blob: string) => void): void;
}
