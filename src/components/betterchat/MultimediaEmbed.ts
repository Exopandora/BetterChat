import { MultimediaEmbedAttachmentFactory } from "../../messages/Attachments";

export function MultimediaEmbed(factory: MultimediaEmbedAttachmentFactory): HTMLElement {
    const container = document.createElement("div");
    let element;
    if (factory.videoWidth == 0 && factory.videoHeight == 0) {
        element = document.createElement("audio");
    } else {
        element = document.createElement("video");
        container.classList.add("ts-attachment-video-content");
        element.style.height = "100%";
        element.style.width = "100%";
    }
    element.setAttribute("controls", "");
    element.src = factory.url;
    container.appendChild(element);
    return container;
}

export namespace MultimediaEmbed {
    export function tryCreateFactory(url: string): Promise<MultimediaEmbedAttachmentFactory> {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.oncanplay = () => resolve(new MultimediaEmbedAttachmentFactory(video, url, video.videoWidth, video.videoHeight));
            video.onerror = () => reject();
            video.src = url;
        });
    }
}
