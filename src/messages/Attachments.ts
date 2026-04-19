import {AudioEmbed} from "../components/betterchat/AudioEmbed";
import {GenericEmbed} from "../components/betterchat/GenericEmbed";
import {ImageEmbed} from "../components/betterchat/ImageEmbed";
import {MultimediaEmbed} from "../components/betterchat/MultimediaEmbed";
import {TwitterEmbed} from "../components/betterchat/TwitterEmbed";
import {VideoEmbed} from "../components/betterchat/VideoEmbed";

export abstract class AttachmentFactory<T extends HTMLElement> {
    private readonly node: T

    protected constructor(node: T) {
        this.node = node;
    }

    cloneNode(): T {
        return this.node.cloneNode(true) as T;
    }

    abstract newInstance(): HTMLElement;
}

export class AudioEmbedAttachmentFactory extends AttachmentFactory<HTMLAudioElement> {
    readonly url: string;

    constructor(node: HTMLAudioElement, url: string) {
        super(node);
        this.url = url;
    }

    newInstance() {
        return AudioEmbed(this);
    }
}

export class GenericEmbedAttachmentFactory extends AttachmentFactory<HTMLElement> {
    readonly url: string;

    constructor(node: HTMLElement, url: string) {
        super(node);
        this.url = url;
    }

    newInstance(): HTMLElement {
        return GenericEmbed(this);
    }
}

export class ImageEmbedAttachmentFactory extends AttachmentFactory<HTMLElement> {
    readonly url: string;

    constructor(node: HTMLElement, url: string) {
        super(node);
        this.url = url;
    }

    newInstance() {
        return ImageEmbed(this);
    }
}

export class MultimediaEmbedAttachmentFactory extends AttachmentFactory<HTMLVideoElement> {
    readonly url: string;
    readonly videoWidth: number;
    readonly videoHeight: number;

    constructor(node: HTMLVideoElement, url: string, videoWidth: number, videoHeight: number) {
        super(node);
        this.url = url;
        this.videoWidth = videoWidth;
        this.videoHeight = videoHeight;
    }

    newInstance(): HTMLElement {
        return MultimediaEmbed(this);
    }
}

export class TwitterEmbedAttachmentFactory extends AttachmentFactory<HTMLElement> {
    constructor(node: HTMLElement) {
        super(node);
    }

    newInstance() {
        return TwitterEmbed(this);
    }
}

export class VideoEmbedAttachmentFactory extends AttachmentFactory<HTMLVideoElement> {
    readonly url: string;

    constructor(node: HTMLVideoElement, url: string) {
        super(node);
        this.url = url;
    }

    newInstance() {
        return VideoEmbed(this);
    }
}

export namespace Attachments {

    const attachmentFactoryCache = new Map<string, Promise<AttachmentFactory<any> | null>>();

    export async function parse(links: string[]): Promise<HTMLElement[]> {
        const link2promise = new Map<string, Promise<AttachmentFactory<any> | null>>();
        for (const link of links) {
            if (link.match(/^https?:\/\/localhost/g) != null) {
                continue;
            } else if (attachmentFactoryCache.has(link)) {
                link2promise.set(link, attachmentFactoryCache.get(link)!!);
                continue;
            } else if (link2promise.has(link)) {
                continue;
            }
            try {
                const url = new URL(link);
                if (!isURLHandledByTSClient(url)) {
                    if (isTwitterURL(url)) {
                        link2promise.set(link, TwitterEmbed.tryCreateFactory(url.href));
                    } else {
                        link2promise.set(link, tryCreateFactory(url));
                    }
                }
            } catch (e) {
                // ignore
            }
        }
        await Promise.allSettled(link2promise.values());
        const result: HTMLElement[] = [];
        for (const [link, promises] of link2promise.entries()) {
            if (!attachmentFactoryCache.has(link)) {
                attachmentFactoryCache.set(link, promises);
            }
            const attachment = await promises;
            if (attachment != null) {
                result.push(attachment.newInstance());
            }
        }
        return result;
    }

    function isURLHandledByTSClient(url: URL): boolean {
        return url.protocol != "https:" && url.protocol != "http:" ||
            url.hostname == "youtube.com" || url.hostname == "www.youtube.com" || url.hostname == "youtu.be" ||
            url.hostname == "giphy.com";
    }

    function isTwitterURL(url: URL): boolean {
        return (url.hostname == "twitter.com" || url.hostname == "x.com") &&
            !url.pathname.startsWith("/home") && !url.pathname.startsWith("/explore") &&
            !url.pathname.startsWith("/notifications") && !url.pathname.startsWith("/messages") &&
            (!url.pathname.startsWith("/i/") || url.pathname.startsWith("/i/status"));
    }

    async function tryCreateFactory(url: URL): Promise<AttachmentFactory<any> | null> {
        const response = await fetch(url.href, {
            method: "GET",
            headers: {
                "User-Agent": navigator.userAgent,
                "Accept": "*/*",
                'Accept-Language': "*",
                'Origin': url.toString(),
            },
            signal: AbortSignal.timeout(5000),
        });
        if (response.status == 200 && response.headers.has("Content-Type")) {
            const contentType = response.headers.get("Content-Type");
            if (contentType != null) {
                if (contentType.startsWith("image/")) {
                    return await ImageEmbed.tryCreateFactory(url.href);
                } else if (contentType.startsWith("video/")) {
                    return await VideoEmbed.tryCreateFactory(url.href);
                } else if (contentType.startsWith("audio/")) {
                    return await AudioEmbed.tryCreateFactory(url.href);
                } else if (contentType == "application/ogg") {
                    return await MultimediaEmbed.tryCreateFactory(url.href);
                } else if (isHtmlOrXmlContentType(contentType)) {
                    return await GenericEmbed.tryCreateFactory(url.href, await response.text());
                }
            }
        }
        return null;
    }

    function isHtmlOrXmlContentType(contentType: string): boolean {
        return contentType.startsWith("text/html") ||
            contentType.startsWith("application/xhtml+xml") ||
            contentType.startsWith("application/xml");
    }
}
