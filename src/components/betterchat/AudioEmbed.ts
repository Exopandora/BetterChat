import {AudioEmbedAttachmentFactory} from "../../messages/Attachments";

export function AudioEmbed(factory: AudioEmbedAttachmentFactory): HTMLElement {
    const container = document.createElement("div");
    const element = document.createElement("audio");
    element.setAttribute("controls", "");
    element.src = factory.url;
    container.appendChild(element);
    return container;
}

export namespace AudioEmbed {
    export function tryCreateFactory(url: string): Promise<AudioEmbedAttachmentFactory> {
        return new Promise((resolve, reject) => {
            const audio = document.createElement("audio");
            audio.oncanplay = () => resolve(new AudioEmbedAttachmentFactory(audio, url));
            audio.onerror = () => reject();
            audio.src = url;
        });
    }
}
