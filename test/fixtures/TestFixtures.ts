import {StyleToken, Token} from "../../src/messages/parser/Token";

export function link(tokens: Token[], a: number, b: number) {
    (tokens[a] as StyleToken).link = tokens[b] as StyleToken;
    (tokens[b] as StyleToken).link = tokens[a] as StyleToken;
}
