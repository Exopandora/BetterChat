import {TwitterEmbedAttachmentFactory} from "../../messages/Attachments";

declare var twttr: any;

const twitterEmbedTheme = "dark";

export function TwitterEmbed(factory: TwitterEmbedAttachmentFactory): HTMLElement {
    const node = factory.cloneNode();
    twttr.widgets.load(node.firstChild);
    return node;
}

export namespace TwitterEmbed {
    export async function tryCreateFactory(url: string): Promise<TwitterEmbedAttachmentFactory> {
        const match = url.match(/^(\S+?)\/photo\/\d+$/);
        if (match != null) {
            url = match[1];
        }
        const tweet = await fetch("https://publish.twitter.com/oembed?theme=" + twitterEmbedTheme +"&dnt=true&omit_script=true&url=" + encodeURIComponent(url));
        const json = await tweet.json();
        const container = document.createElement("div");
        container.innerHTML = json.html;
        (<HTMLElement>container.firstChild).style.display = "none";
        container.classList.add("ts-chat-message-attachment-integration");
        container.style.marginTop = "-10px";
        container.style.marginBottom = "-10px";
        return new TwitterEmbedAttachmentFactory(container);
    }
}
