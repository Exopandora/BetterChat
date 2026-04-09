import {ImageEmbedAttachmentFactory} from "../../messages/Attachments";
import {ImagePreview} from "./ImagePreview";

export function ImageEmbed(factory: ImageEmbedAttachmentFactory): HTMLElement {
    const node = factory.cloneNode();
    node.onclick = (event: PointerEvent) => {
        document.body.appendChild(ImagePreview(factory.url, factory.naturalWidth, factory.naturalHeight));
        event.stopPropagation();
        event.preventDefault();
    };
    return node;
}

export namespace ImageEmbed {
    export function tryCreateFactory(url: string): Promise<ImageEmbedAttachmentFactory> {
        return new Promise((resolve, reject) => {
            const img = document.createElement("img");
            img.onload = () => {
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
                resolve(new ImageEmbedAttachmentFactory(integration, url, img.naturalWidth, img.naturalHeight));
            };
            img.onerror = () => reject();
            img.src = url;
        });
    }
}
