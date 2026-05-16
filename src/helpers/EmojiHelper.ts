export type Emoji = {
    hexcode: string;
    shortcodes: string[];
    svgContent: string;
};

type EmojiCategory = {
    hexcodes: string[],
    key: string,
};

type EmojiData = {
    categories: EmojiCategory[];
    emojis: Emoji[],
};

export namespace EmojiHelper {
    const shortcodeToEmoji = new Map<string, Emoji>();
    export function init() {
        fetch("/images/metadata/emoji_data.json.gz")
            .then(response => new Promise<EmojiData>((resolve, reject) => {
                const chunks: Uint8Array<ArrayBuffer>[] = [];
                // noinspection JSIgnoredPromiseFromCall
                response.body!!.pipeThrough(new DecompressionStream("gzip")).pipeTo(new WritableStream({
                    write(chunk) {
                        chunks.push(chunk);
                    },
                    close() {
                        const textDecoder = new TextDecoder();
                        const concatChunks = (chunks: Uint8Array<ArrayBuffer>[]) => {
                            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                            const result = new Uint8Array(totalLength);
                            let offset = 0;
                            for (const chunk of chunks) {
                                result.set(chunk, offset);
                                offset += chunk.length;
                            }
                            return result;
                        };
                        resolve(JSON.parse(textDecoder.decode(concatChunks(chunks))));
                    },
                    abort(e) {
                        reject(e);
                    },
                }));
            })).then((emojiData: EmojiData) => {
                for (const emoji of emojiData.emojis) {
                    for (const shortcode of emoji.shortcodes) {
                        shortcodeToEmoji.set(shortcode, emoji);
                    }
                }
            }).catch((error) => {
                throw error;
            });
    }

    export function getEmojiByShortcode(shortcode: string): Emoji | null {
        return shortcodeToEmoji.get(shortcode) ?? null;
    }
}
