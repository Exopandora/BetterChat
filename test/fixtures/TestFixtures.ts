import {EmojiToken, StyleToken, Token} from "../../src/messages/parser/Token";

export function link(tokens: Token[], a: number, b: number) {
    (tokens[a] as StyleToken).link = tokens[b] as StyleToken;
    (tokens[b] as StyleToken).link = tokens[a] as StyleToken;
}

export function createEmojiToken(code: string): EmojiToken {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", "0 0 36 36");
    svg.classList.add("ts-chat-message-content-emoji", "ts-parsed-text-content-emoji");
    return new EmojiToken(svg, code != null ? ":" + code + ":" : null);
}
