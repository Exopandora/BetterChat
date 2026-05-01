import {StringReader} from "../../helpers/StringReader";
import {getVueInstance} from "../../helpers/Util";
import {Style, Styles} from "../Styles";
import {EmojiToken, StringToken, StyleToken, Token, Tokens} from "./Token";

export namespace Tokenizer {
    export function tokenizeHTML(node: HTMLElement): Token[] {
        const tokens: Token[] = []
        for (const child of node.childNodes) {
            const childElement = child as HTMLElement;
            if (childElement.tagName == "A") {
                tokens.push(new StringToken(childElement.textContent));
            } else if (childElement.tagName == "STRONG") {
                tokens.push(...wrapStyle(Styles.BOLD, "**", ...tokenizeHTML(childElement)));
            } else if (childElement.tagName == "DEL") {
                tokens.push(...wrapStyle(Styles.STRIKETHROUGH, "~~", ...tokenizeHTML(childElement)));
            } else if (childElement.tagName == "EM") {
                tokens.push(...wrapStyle(Styles.ITALIC, "__", ...tokenizeHTML(childElement)));
            } else if (childElement.tagName == "P" && childElement.classList.contains("spoiler")) {
                tokens.push(...wrapStyle(Styles.SPOILER, "||", ...tokenizeHTML(childElement)));
            } else if (childElement.tagName == "PRE") {
                tokens.push(...wrapStyle(Styles.CODE, "```", new StringToken(childElement.textContent)));
            } else if (childElement.tagName == "CODE") {
                tokens.push(...wrapStyle(Styles.PRE, "`", new StringToken(childElement.textContent)));
            } else if (childElement.tagName == "svg" && childElement.dataset.type == "emoji") {
                tokens.push(new EmojiToken(childElement));
            } else {
                tokens.push(new StringToken(childElement.textContent));
            }
        }
        return tokens;
    }

    function wrapStyle(style: Style, string: string, ...content: Token[]): Token[] {
        const startingStyleToken = new StyleToken(style, StyleToken.Type.START, string);
        const endingStyleToken = new StyleToken(style, StyleToken.Type.END, string);
        startingStyleToken.link = endingStyleToken;
        endingStyleToken.link = startingStyleToken;
        return [startingStyleToken, ...content, endingStyleToken];
    }

    export function tokenizeString(message: string): Token[] {
        if (message.length < 8) {
            return [new StringToken(message)];
        }
        const tokens: Token[] = [];
        const reader = new StringReader(message);
        let cursor = 0;
        while (reader.canRead()) {
            if (reader.read() != "[") {
                continue;
            }
            // try parse bbcode tag
            const isEscaped = reader.cursor > 1 && reader.peek(-2) == "\\";
            const tagReader = reader.copy();
            const isEndTag = tagReader.canRead() && tagReader.peek() == "/";
            if (isEndTag) {
                tagReader.skip();
            }
            while (tagReader.canRead() && isAllowedBBCodeChar(tagReader.peek())) {
                tagReader.skip();
            }
            let bbCode: string | null = null;
            let bbValue: string | null = null;
            if (!isEndTag && tagReader.canRead() && tagReader.peek() == "=") { // parse value
                const valueReader = tagReader.copy();
                valueReader.skip();
                bbValue = readBBValue(valueReader);
                if (valueReader.canRead() && valueReader.peek() == "]") {
                    bbCode = message.substring(reader.cursor, tagReader.cursor).toLowerCase();
                    tagReader.cursor = valueReader.cursor;
                }
            } else if (tagReader.canRead() && tagReader.peek() == "]") { // bbcode tag found
                bbCode = message.substring(reader.cursor + (isEndTag ? 1 : 0), tagReader.cursor).toLowerCase();
            }
            if (bbCode != null) { // validate parsed result
                const style = Styles.fromBBCode(bbCode);
                if (style != null && ((isEndTag && bbValue == null) || style.isValidValue(bbValue))) {
                    const index = reader.cursor - 1 - (isEscaped ? 1 : 0);
                    if (cursor < index) {
                        tokens.push(new StringToken(message.substring(cursor, index)));
                    }
                    const type = isEndTag ? StyleToken.Type.END : StyleToken.Type.START;
                    const options = {
                        string: reader.string.substring(index, tagReader.cursor + 1),
                        escaped: isEscaped,
                        value: bbValue,
                    };
                    tokens.push(new StyleToken(style, type, options));
                    reader.cursor = tagReader.cursor + 1;
                    cursor = reader.cursor;
                }
            }
        }
        if (cursor < reader.cursor) {
            tokens.push(new StringToken(message.substring(cursor, reader.cursor)));
        }
        return tokens;
    }

    function isAllowedBBCodeChar(char: string): boolean {
        return char != "[" && char != "]" && char != "=";
    }

    function isAllowedBBCodeValueChar(char: string): boolean {
        return char != "[" && char != "]";
    }

    function readBBValue(reader: StringReader): string | null {
        if (!reader.canRead()) {
            return null;
        }
        if (reader.peek() == "\"") {
            reader.skip();
            return readStringUntil(reader, "\"");
        }
        const start = reader.cursor;
        while (reader.canRead() && isAllowedBBCodeValueChar(reader.peek())) {
            reader.skip();
        }
        return reader.string.substring(start, reader.cursor);
    }

    function readStringUntil(reader: StringReader, terminator: string): string | null {
        let result = "";
        let escaped = false;
        while (reader.canRead()) {
            const c = reader.read();
            if (escaped) {
                if (c == terminator || c == "\\") {
                    result += c;
                    escaped = false;
                } else {
                    return null;
                }
            } else if (c == "\\") {
                escaped = true;
            } else if (c == terminator) {
                return result;
            } else {
                result += c;
            }
        }
        return null;
    }
}
