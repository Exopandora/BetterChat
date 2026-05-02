import {EmojiToken, StyleToken, Token} from "../../src/messages/parser/Token";

export function link(tokens: Token[], a: number, b: number) {
    (tokens[a] as StyleToken).link = tokens[b] as StyleToken;
    (tokens[b] as StyleToken).link = tokens[a] as StyleToken;
}

export function createEmojiToken(code: string): EmojiToken {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    (svg as any).__vue__ = {
        tsEmoji: {
            shortcodes: [code],
        }
    };
    return new EmojiToken(svg);
}
