import {getVueInstance} from "../../helpers/Util";
import {Style} from "../Styles";

export interface Token {
    readonly string: string;
}

export class StringToken implements Token {
    readonly string: string;

    constructor(string: string) {
        this.string = string;
    }
}

export class StyleToken implements Token {
    readonly string: string;
    readonly style: Style;
    readonly type: StyleToken.Type;
    readonly escaped: boolean;
    readonly value: string | null;
    link: StyleToken | null = null;

    constructor(
        style: Style,
        type: StyleToken.Type,
        options?: {
            string?: string,
            escaped?: boolean,
            value?: string | null,
        },
    ) {
        this.style = style;
        this.type = type;
        this.string = options?.string ?? "";
        this.escaped = options?.escaped ?? false;
        this.value = options?.value ?? null;
    }
}

export namespace StyleToken {
    export enum Type {
        START,
        END,
    }
}

export class EmojiToken implements Token {
    private readonly _string: string | null;
    readonly emoji: SVGSVGElement;

    constructor(emoji: SVGSVGElement, string: string | null = null) {
        this.emoji = emoji;
        this._string = string;
    }

    get string(): string {
        return this._string ?? (":" + getVueInstance(this.emoji).tsEmoji.shortcodes[0] + ":");
    }
}

export namespace Tokens {
    export function mergeConsecutiveStringTokens(tokens: Token[]): Token[] {
        const result: Token[] = [];
        const tokenIterator = tokens.values();
        let token = tokenIterator.next();
        while (!token.done) {
            let buffer = "";
            while (!token.done && (token.value instanceof StringToken)) {
                buffer += token.value.string;
                token = tokenIterator.next();
            }
            if (buffer.length > 0) {
                result.push(new StringToken(buffer));
            }
            if (!token.done) {
                result.push(token.value);
            }
            token = tokenIterator.next();
        }
        return result;
    }
}
