import {StringReader} from "../../helpers/StringReader";
import {Styles} from "../Styles";
import {StringToken, StyleToken, Token} from "./Token";

export namespace Tokenizer {
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
