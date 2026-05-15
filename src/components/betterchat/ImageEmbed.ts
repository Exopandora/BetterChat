import {openImagePreview} from "../../helpers/Util";
import {ImageEmbedAttachmentFactory} from "../../messages/Attachments";

export function ImageEmbed(factory: ImageEmbedAttachmentFactory): HTMLElement {
    const node = factory.cloneNode();
    node.addEventListener("click", (event: PointerEvent) => {
        openImagePreview(factory.url);
        event.stopPropagation();
        event.preventDefault();
    })
    return node;
}

export namespace ImageEmbed {
    export function tryCreateFactory(url: string): Promise<ImageEmbedAttachmentFactory> {
        return new Promise((resolve, reject) => {
            const img = document.createElement("img");
            img.addEventListener("load", () => {
                img.classList.add("display");
                img.style.cursor = "pointer";
                const backing = document.createElement("img");
                backing.src = url;
                backing.classList.add("backing");
                const container = document.createElement("div");
                container.classList.add("ts-chat-message-attachment-image");
                container.appendChild(backing);
                container.appendChild(img);
                const integration = document.createElement("div");
                integration.classList.add("ts-chat-message-attachment-integration");
                integration.appendChild(container);
                resolve(new ImageEmbedAttachmentFactory(integration, url));
            });
            img.addEventListener("error", (e: ErrorEvent) => reject(e));
            img.src = url;
        });
    }
}
