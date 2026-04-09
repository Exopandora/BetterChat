import {EmojiToken, StyleToken, Token} from "../../src/messages/parser/Tokenizer";

export function link(tokens: Token[], a: number, b: number) {
    (<StyleToken>tokens[a]).link = <StyleToken>tokens[b];
    (<StyleToken>tokens[b]).link = <StyleToken>tokens[a];
}

export function createEmojiToken(code: string): EmojiToken {
    const svg = document.createElement("svg");
    (<any>svg).__vue__ = {
        tsEmoji: {
            shortcodes: [code],
        }
    };
    return new EmojiToken(svg);
}
