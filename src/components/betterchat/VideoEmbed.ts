import {VideoEmbedAttachmentFactory} from "../../messages/Attachments";

export function VideoEmbed(factory: VideoEmbedAttachmentFactory): HTMLElement {
    const container = document.createElement("div");
    const element = document.createElement("video");
    container.classList.add("ts-attachment-video-content");
    element.style.height = "100%";
    element.style.width = "100%";
    element.setAttribute("controls", "");
    element.src = factory.url;
    container.appendChild(element);
    return container;
}

export namespace VideoEmbed {
    export function tryCreateFactory(url: string): Promise<VideoEmbedAttachmentFactory> {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.oncanplay = () => resolve(new VideoEmbedAttachmentFactory(video, url));
            video.onerror = () => reject();
            video.src = url;
        });
    }
}
