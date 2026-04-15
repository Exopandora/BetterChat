import {
    BlockquoteNode,
    BoldNode,
    CenterAlignNode,
    CodeNode,
    ColorNode,
    DetailsNode,
    DocumentNode,
    EmojiNode,
    FootnoteNode,
    HeadingNode,
    HighlightNode,
    InlineCodeNode,
    InlineMathNode,
    ItalicNode,
    LeftAlignNode,
    ListItemNode,
    ListNode,
    MathNode,
    Node,
    RightAlignNode,
    SpoilerNode,
    StrikethroughNode,
    StringNode,
    SubscriptNode,
    SuperscriptNode,
    TableDataNode,
    TableHeaderNode,
    TableNode,
    TableRowNode,
    ThematicBreakNode,
    UnderlineNode,
    UrlNode
} from "../node/Node";
import {Style, Styles} from "../Styles";
import {EmojiToken, StringToken, StyleToken, Token, Tokenizer} from "./Tokenizer";
import BlockquoteType = BlockquoteNode.BlockquoteType;

export namespace Parser {
    import ListType = ListNode.ListType;

    export function parse(node: HTMLElement): DocumentNode {
        const htmlTokens = Tokenizer.tokenizeHTML(node);
        const originalMessage = htmlTokens.map(token => token.string).join("");
        const messageTokens = Tokenizer.tokenizeString(originalMessage);
        const mergedTokens = mergeTokenArrays(htmlTokens, messageTokens);
        const steps = [
            linkStyleTokens,
            convertToStringToken((token) => token instanceof StyleToken && (token.link == null && !token.style.isStandalone || token.escaped)),
            parseUrlTokens,
            applyNestingRule,
            applyListRules,
            applyTableRules,
            sliceOverlappingStyleRanges,
            applyNestingRule, // apply nesting rule again, because [i][code][/code][/i] would be sliced into [i][/i][code][i][/i][/code][i][/i]
        ];
        const tokens = steps.reduce((result, step) => step(result), mergedTokens);
        const nodes = parseNodes(tokens);
        return new DocumentNode(nodes);
    }

    export function parseNodes(tokens: Token[]): Node[] {
        const nodes: Node[] = [];
        for (let x = 0; x < tokens.length; x++) {
            const token = tokens[x];
            if (token instanceof StringToken) {
                if (nodes.length > 0 && nodes[nodes.length - 1] instanceof StringNode) {
                    nodes[nodes.length - 1] = new StringNode((nodes[nodes.length - 1] as StringNode).string + token.string);
                } else {
                    nodes.push(new StringNode(token.string));
                }
            } else if (token instanceof EmojiToken) {
                nodes.push(new EmojiNode(token.emoji));
            } else if (token instanceof StyleToken) {
                const children: Node[] = [];
                if (!token.style.isStandalone) {
                    const endIndex = tokens.indexOf(token.link!!);
                    if (endIndex == -1) {
                        throw new Error("Invalid arguments");
                    }
                    const slice = tokens.slice(x + 1, endIndex);
                    const childNodes = parseNodes(slice);
                    x += slice.length + 1;
                    if (childNodes.length == 0) {
                        continue;
                    }
                    children.push(...childNodes);
                }
                switch (token.style) {
                    case Styles.URL:
                        nodes.push(new UrlNode(token.value!!, children));
                        break;
                    case Styles.BOLD:
                        nodes.push(new BoldNode(children));
                        break;
                    case Styles.UNDERLINE:
                        nodes.push(new UnderlineNode(children));
                        break;
                    case Styles.ITALIC:
                        nodes.push(new ItalicNode(children));
                        break;
                    case Styles.STRIKETHROUGH:
                        nodes.push(new StrikethroughNode(children));
                        break;
                    case Styles.COLOR:
                        nodes.push(new ColorNode(token.value!!, children));
                        break;
                    case Styles.SPOILER:
                        nodes.push(new SpoilerNode(children));
                        break;
                    case Styles.CODE:
                        nodes.push(new CodeNode(token.value, children));
                        break;
                    case Styles.PRE:
                        nodes.push(new InlineCodeNode(children));
                        break;
                    case Styles.SUPERSCRIPT:
                        nodes.push(new SuperscriptNode(children));
                        break;
                    case Styles.SUBSCRIPT:
                        nodes.push(new SubscriptNode(children));
                        break;
                    case Styles.DETAILS:
                        nodes.push(new DetailsNode(token.value, children));
                        break;
                    case Styles.THEMATIC_BREAK:
                        nodes.push(new ThematicBreakNode());
                        break;
                    case Styles.HEADING_1:
                        nodes.push(new HeadingNode(1, children));
                        break;
                    case Styles.HEADING_2:
                        nodes.push(new HeadingNode(2, children));
                        break;
                    case Styles.HEADING_3:
                        nodes.push(new HeadingNode(3, children));
                        break;
                    case Styles.HEADING_4:
                        nodes.push(new HeadingNode(4, children));
                        break;
                    case Styles.HEADING_5:
                        nodes.push(new HeadingNode(5, children));
                        break;
                    case Styles.HEADING_6:
                        nodes.push(new HeadingNode(6, children));
                        break;
                    case Styles.CENTER:
                        nodes.push(new CenterAlignNode(children));
                        break;
                    case Styles.RIGHT:
                        nodes.push(new RightAlignNode(children));
                        break;
                    case Styles.LEFT:
                        nodes.push(new LeftAlignNode(children));
                        break;
                    case Styles.HIGHLIGHT:
                        nodes.push(new HighlightNode(children));
                        break;
                    case Styles.FOOTNOTE:
                        nodes.push(new FootnoteNode(children));
                        break;
                    case Styles.ORDERED_LIST:
                        nodes.push(new ListNode(ListType.ORDERED, children));
                        break;
                    case Styles.UNORDERED_LIST:
                        nodes.push(new ListNode(ListType.UNORDERED, children));
                        break;
                    case Styles.LIST_ITEM:
                        nodes.push(new ListItemNode(children));
                        break;
                    case Styles.TABLE:
                        nodes.push(new TableNode(children));
                        break;
                    case Styles.TABLE_ROW:
                        nodes.push(new TableRowNode(children));
                        break;
                    case Styles.TABLE_HEADER:
                        nodes.push(new TableHeaderNode(children));
                        break;
                    case Styles.TABLE_DATA:
                        nodes.push(new TableDataNode(children));
                        break;
                    case Styles.MATH:
                        nodes.push(new MathNode(children));
                        break;
                    case Styles.INLINE_MATH:
                        nodes.push(new InlineMathNode(children));
                        break;
                    case Styles.QUOTE:
                        nodes.push(new BlockquoteNode(token.value, BlockquoteType.DEFAULT, children));
                        break;
                    case Styles.NOTE:
                        nodes.push(new BlockquoteNode("Note", BlockquoteType.NOTE, children));
                        break;
                    case Styles.TIP:
                        nodes.push(new BlockquoteNode("Tip", BlockquoteType.TIP, children));
                        break;
                    case Styles.IMPORTANT:
                        nodes.push(new BlockquoteNode("Important", BlockquoteType.IMPORTANT, children));
                        break;
                    case Styles.WARNING:
                        nodes.push(new BlockquoteNode("Warning", BlockquoteType.WARNING, children));
                        break;
                    case Styles.CAUTION:
                        nodes.push(new BlockquoteNode("Caution", BlockquoteType.CAUTION, children));
                        break;
                    default:
                        throw new Error(`Unknown style ${token.style.name}`);
                }
            }
        }
        return nodes;
    }

    export function applyNestingRule(tokens: Token[]): Token[] {
        const tokensToConvert: Set<Token> = new Set<Token>();
        for (let x = 0; x < tokens.length; x++) {
            const token = tokens[x];
            if (token instanceof StyleToken && token.type == StyleToken.Type.START && !token.style.allowsNesting && !token.style.isStandalone && !tokensToConvert.has(token)) {
                for (let y = x + 1; y < tokens.length; y++) {
                    const other = tokens[y];
                    if (other == token.link) {
                        break;
                    } else if (!(other instanceof StringToken)) {
                        tokensToConvert.add(other);
                        if (other instanceof StyleToken && other.link != null) {
                            tokensToConvert.add(other.link);
                        }
                    }
                }
            }
        }
        if (tokensToConvert.size == 0) {
            return tokens;
        }
        return mergeConsecutiveStringTokens(tokens.map(token => tokensToConvert.has(token) ? new StringToken(token.string) : token));
    }

    export function applyListRules(tokens: Token[]): Token[] {
        const tokensToConvert: Set<Token> = new Set<Token>();
        const validListItemTokens = new Set<Token>();
        for (let x = 0; x < tokens.length; x++) {
            const token = tokens[x];
            if (token instanceof StyleToken && token.type == StyleToken.Type.START) {
                if (isListStyle(token.style)) {
                    const listItemTokens: Token[] = [];
                    let isValidListStructure = true;
                    for (let y = x + 1; y < tokens.length; y++) {
                        const other = tokens[y];
                        if (other == token.link) {
                            break;
                        } else if (other instanceof StyleToken && other.type == StyleToken.Type.START && other.style == Styles.LIST_ITEM) {
                            listItemTokens.push(other, other.link!!);
                            for (let z = y + 1; z < tokens.length; z++) {
                                if (tokens[z] == other.link) {
                                    y = z;
                                    break;
                                }
                            }
                        } else if (!(other instanceof StringToken && other.string.trim().length == 0)) {
                            isValidListStructure = false;
                        }
                    }
                    if (!isValidListStructure) {
                        tokensToConvert.add(token);
                        tokensToConvert.add(token.link!!);
                        for (const item of listItemTokens) {
                            tokensToConvert.add(item);
                        }
                    } else {
                        for (const item of listItemTokens) {
                            validListItemTokens.add(item);
                        }
                    }
                } else if (token.style == Styles.LIST_ITEM && !validListItemTokens.has(token)) {
                    tokensToConvert.add(token);
                    tokensToConvert.add(token.link!!);
                }
            }
        }
        if (tokensToConvert.size == 0) {
            return tokens;
        }
        return mergeConsecutiveStringTokens(tokens.map(token => tokensToConvert.has(token) ? new StringToken(token.string) : token));
    }

    function isListStyle(style: Style): boolean {
        return style == Styles.UNORDERED_LIST || style == Styles.ORDERED_LIST;
    }

    export function applyTableRules(tokens: Token[]): Token[] {
        const tokensToConvert: Set<Token> = new Set<Token>();
        const validTableTokens = new Set<Token>();
        for (let x = 0; x < tokens.length; x++) {
            const token = tokens[x];
            if (token instanceof StyleToken && token.type == StyleToken.Type.START) {
                if (token.style == Styles.TABLE) {
                    const tableTokens: Token[] = [];
                    let isValidTableStructure = true;
                    for (let y = x + 1; y < tokens.length; y++) {
                        const other = tokens[y];
                        if (other == token.link) {
                            break;
                        } else if (other instanceof StyleToken && other.type == StyleToken.Type.START && other.style == Styles.TABLE_ROW) {
                            tableTokens.push(other, other.link!!);
                            for (let z = y + 1; z < tokens.length; z++) {
                                const nested = tokens[z];
                                if (nested == other.link) {
                                    y = z;
                                    break;
                                } else if (nested instanceof StyleToken && nested.type == StyleToken.Type.START && isTableCell(nested.style)) {
                                    tableTokens.push(nested, nested.link!!);
                                    for (let u = z + 1; u < tokens.length; u++) {
                                        if (tokens[u] == nested.link) {
                                            z = u;
                                            break;
                                        }
                                    }
                                } else if (!(nested instanceof StringToken && nested.string.trim().length == 0)) {
                                    isValidTableStructure = false;
                                }
                            }
                        } else if (!(other instanceof StringToken && other.string.trim().length == 0)) {
                            isValidTableStructure = false;
                        }
                    }
                    if (!isValidTableStructure) {
                        tokensToConvert.add(token);
                        tokensToConvert.add(token.link!!);
                        for (const item of tableTokens) {
                            tokensToConvert.add(item);
                        }
                    } else {
                        for (const item of tableTokens) {
                            validTableTokens.add(item);
                        }
                    }
                } else if ((token.style == Styles.TABLE_ROW || isTableCell(token.style)) && !validTableTokens.has(token)) {
                    tokensToConvert.add(token);
                    tokensToConvert.add(token.link!!);
                }
            }
        }
        if (tokensToConvert.size == 0) {
            return tokens;
        }
        return mergeConsecutiveStringTokens(tokens.map(token => tokensToConvert.has(token) ? new StringToken(token.string) : token));
    }

    function isTableCell(style: Style): boolean {
        return style == Styles.TABLE_DATA || style == Styles.TABLE_HEADER;
    }

    // tokens: <pre>a-b-c-a-c-b</pre></br>
    // result: <pre>a-a ab-ba abc-cba bc-cb b-b</pre>
    export function sliceOverlappingStyleRanges(tokens: Token[]): Token[] {
        const result: Token[] = [];
        let styleTokens: StyleToken[] = [];
        for (const token of tokens) {
            if (token instanceof StyleToken) {
                const startingTokens: StyleToken[] = [];
                const endingTokens: StyleToken[] = [];
                for (const styleToken of styleTokens) {
                    if (token.type == StyleToken.Type.END && styleToken == token.link) {
                        endingTokens.unshift(token);
                    } else {
                        const endingStyleToken = new StyleToken(styleToken.style, StyleToken.Type.END);
                        const startingStyleToken = new StyleToken(styleToken.style, StyleToken.Type.START, "", false, styleToken.value);
                        endingStyleToken.link = styleToken;
                        startingStyleToken.link = styleToken.link;
                        styleToken.link!!.link = startingStyleToken;
                        styleToken.link = endingStyleToken;
                        startingTokens.push(startingStyleToken);
                        endingTokens.unshift(endingStyleToken);
                    }
                }
                if (token.type == StyleToken.Type.START) {
                    styleTokens = [...startingTokens];
                    if (token.style.allowsSlicing && !token.style.isStandalone) {
                        result.push(...endingTokens, ...startingTokens, token);
                        styleTokens.push(token);
                    } else {
                        result.push(...endingTokens, token, ...startingTokens);
                    }
                } else {
                    result.push(...endingTokens);
                    if (!token.style.allowsSlicing || token.style.isStandalone) {
                        result.push(token);
                    }
                    result.push(...startingTokens);
                    styleTokens = startingTokens;
                }
            } else {
                result.push(token);
            }
        }
        return result;
    }

    /**
     * Assumptions:
     * - URLs only span across string tokens
     */
    export function parseUrlTokens(tokens: Token[]): Token[] {
        const result: Token[] = [];
        for (const token of tokens) {
            if (token instanceof StringToken) {
                let index = 0;
                let match;
                const urlRegex = /(\w+:\/\/\S+)/g;
                while ((match = urlRegex.exec(token.string)) != null) {
                    const url = token.string.substring(match.index, match.index + match[0].length);
                    if (match.index > index) {
                        result.push(new StringToken(token.string.substring(index, match.index)));
                    }
                    const startingStyleToken = new StyleToken(Styles.URL, StyleToken.Type.START, "", false, url);
                    const endingStyleToken = new StyleToken(Styles.URL, StyleToken.Type.END);
                    startingStyleToken.link = endingStyleToken;
                    endingStyleToken.link = startingStyleToken;
                    const urlStringToken = new StringToken(url);
                    result.push(startingStyleToken, urlStringToken, endingStyleToken);
                    index = match.index + url.length;
                }
                if (index < token.string.length) {
                    result.push(new StringToken(token.string.substring(index)));
                }
            } else {
                result.push(token);
            }
        }
        return result;
    }

    export function convertToStringToken(predicate: (token: Token) => boolean): (tokens: Token[]) => Token[] {
        return (tokens: Token[]): Token[] => {
            const result: Token[] = [];
            for (const token of tokens) {
                if (predicate(token)) {
                    result.push(new StringToken(token.string));
                } else {
                    result.push(token);
                }
            }
            return mergeConsecutiveStringTokens(result);
        }
    }

    export function linkStyleTokens(tokens: Token[]): Token[] {
        for (let x = 0; x < tokens.length; x++) {
            const token = tokens[x];
            if (token instanceof StyleToken && token.link == null && token.type == StyleToken.Type.START) {
                let depth = 0;
                for (let y = x + 1; y < tokens.length; y++) {
                    const other = tokens[y];
                    if (other instanceof StyleToken && other.style == token.style) {
                        if (other.type == StyleToken.Type.START) {
                            depth++;
                        } else if (depth > 0) {
                            depth--;
                        } else {
                            if (other.link == null) {
                                token.link = other;
                                other.link = token;
                            }
                            break;
                        }
                    }
                }
            }
        }
        return tokens;
    }

    // tokens: <pre>----[]---------[]---------[]------------[]----</pre></br>
    // others: <pre>-----------[]----------[]-----------[]------[]</pre></br>
    // result: <pre>----[]-----[]--[]------[]-[]--------[]--[]--[]</pre></br>
    export function mergeTokenArrays(tokens: Token[], others: Token[]): Token[] {
        const tokenIterator = convertOverlappingStyleTokensToStringTokens(tokens, others).values();
        const otherIterator = others.values();
        let token = tokenIterator.next();
        let other = otherIterator.next();
        let tokenCursor = 0;
        let otherCursor = 0;
        let tokenOffset = 0;
        let otherOffset = 0;
        const result: Token[] = [];
        while (!token.done && !other.done) {
            if (tokenCursor + token.value.string.length < otherCursor + other.value.string.length) {
                if (token.value instanceof StringToken && tokenOffset > 0) {
                    result.push(new StringToken(token.value.string.substring(tokenOffset)));
                } else {
                    result.push(token.value);
                }
                otherOffset += token.value.string.length - tokenOffset;
                tokenOffset = 0;
                tokenCursor += token.value.string.length;
                token = tokenIterator.next();
            } else if (tokenCursor + token.value.string.length > otherCursor + other.value.string.length) {
                if (other.value instanceof StringToken && otherOffset > 0) {
                    result.push(new StringToken(other.value.string.substring(otherOffset)));
                } else {
                    result.push(other.value);
                }
                tokenOffset += other.value.string.length - otherOffset;
                otherOffset = 0;
                otherCursor += other.value.string.length;
                other = otherIterator.next();
            } else {
                if (token.value instanceof StringToken) {
                    if (other.value instanceof StringToken) {
                        result.push(new StringToken(token.value.string.substring(tokenOffset)));
                    } else {
                        result.push(other.value);
                    }
                } else if (other.value instanceof StringToken) {
                    if (token.value instanceof StringToken) {
                        result.push(new StringToken(other.value.string.substring(tokenOffset)));
                    } else {
                        result.push(token.value);
                    }
                } else {
                    result.push(token.value);
                }
                tokenOffset = 0;
                tokenCursor += token.value.string.length;
                token = tokenIterator.next();
                otherOffset = 0;
                otherCursor += other.value.string.length;
                other = otherIterator.next();
            }
        }
        return mergeConsecutiveStringTokens(result);
    }

    export function convertOverlappingStyleTokensToStringTokens(tokens: Token[], others: Token[]): Token[] {
        const tokenIterator = tokens.values();
        const otherIterator = others.values();
        let token = tokenIterator.next();
        let other = otherIterator.next();
        let tokenCursor = 0;
        let otherCursor = 0;
        const result: Token[] = [];
        const links: Set<Token> = new Set<Token>();
        while (!token.done) {
            let flag = false;
            while (!other.done && otherCursor < tokenCursor + token.value.string.length) {
                if (other.value instanceof StyleToken && !(token.value instanceof StringToken)) {
                    flag = true;
                }
                otherCursor += other.value.string.length;
                other = otherIterator.next();
            }
            if (links.has(token.value)) {
                result.push(new StringToken(token.value.string));
                links.delete(token.value);
            } else if (flag) {
                result.push(new StringToken(token.value.string));
                if (token.value instanceof StyleToken && token.value.link != null) {
                    links.add(token.value.link);
                }
            } else {
                result.push(token.value);
            }
            tokenCursor += token.value.string.length;
            token = tokenIterator.next();
        }
        return mergeConsecutiveStringTokens(result);
    }

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

