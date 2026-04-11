import {Tooltips} from "../../helpers/Tooltips";
import {truncateString} from "../../helpers/Util";
import getMetaData from "../../lib/metadata-scraper";
import {GenericEmbedAttachmentFactory} from "../../messages/Attachments";
import {ImagePreview} from "./ImagePreview";

export function GenericEmbed(factory: GenericEmbedAttachmentFactory): HTMLElement {
    const node = factory.cloneNode();
    const title = node.querySelector("div.betterchat-attachment-title-container a")!!;
    Tooltips.create(title, "Links to: " + factory.url);
    const img = node.querySelector("img.betterchat-attachment-image") as HTMLImageElement;
    if (img != null) {
        img.onclick = (event: PointerEvent) => {
            if (event.shiftKey) {
                document.body.appendChild(ImagePreview(img.src, img.naturalWidth, img.naturalHeight));
                event.stopPropagation();
                event.preventDefault();
            }
        };
    }
    return node;
}

export namespace GenericEmbed {
    export async function tryCreateFactory(url: string, html: string): Promise<GenericEmbedAttachmentFactory | null> {
        try {
            const data = await getMetaData({url: url, html: html});
            const attachmentContainer = document.createElement("div");
            attachmentContainer.classList.add("betterchat-attachment-container");
            const attachmentHeader = document.createElement("div");
            attachmentHeader.classList.add("betterchat-attachment-header");
            if (data.icon) {
                const faviconContainer = document.createElement("div");
                faviconContainer.classList.add("betterchat-attachment-favicon-container");
                const favicon = document.createElement("img");
                favicon.classList.add("betterchat-attachment-favicon");
                favicon.src = data.icon;
                faviconContainer.appendChild(favicon);
                attachmentHeader.appendChild(faviconContainer);
            }
            const titleContainer = document.createElement("div");
            titleContainer.classList.add("betterchat-attachment-title-container");
            const title = document.createElement("a");
            title.href = url;
            title.target = "_blank";
            title.textContent = truncateString(data.title || url, 150);
            titleContainer.appendChild(title);
            attachmentHeader.appendChild(titleContainer);
            const attachmentContentContainer = document.createElement("div");
            attachmentContentContainer.classList.add("betterchat-attachment-content-container");
            const hasDescription = data.description != null && data.description.trim().length > 0;
            if (data.image) {
                const imageContainer = document.createElement("div");
                imageContainer.classList.add("betterchat-attachment-image-container");
                if (hasDescription) {
                    imageContainer.classList.add("betterchat-attachment-image-container-description");
                }
                const imageLink = document.createElement("a");
                imageLink.href = url;
                imageLink.target = "_blank";
                imageLink.style.display = "inline-block";
                const image = document.createElement("img");
                image.classList.add("betterchat-attachment-image");
                image.src = data.image;
                imageLink.appendChild(image);
                imageContainer.appendChild(imageLink);
                attachmentContentContainer.appendChild(imageContainer);
            }
            if (hasDescription) {
                const description = document.createElement("div");
                description.classList.add("betterchat-attachment-description");
                description.textContent = truncateString(data.description!!, data.image ? 200 : 500);
                attachmentContentContainer.appendChild(description);
            }
            attachmentContainer.appendChild(attachmentHeader);
            attachmentContainer.appendChild(attachmentContentContainer);
            return new GenericEmbedAttachmentFactory(attachmentContainer, url);
        } catch (_) {
            return null;
        }
    }
}
