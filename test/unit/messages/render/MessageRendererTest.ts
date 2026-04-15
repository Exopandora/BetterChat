import {afterEach, describe, expect, it} from '@jest/globals';
import formatXml from "xml-formatter";
import {Tooltips} from "../../../../src/helpers/Tooltips";
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
} from "../../../../src/messages/node/Node";
import {MessageRenderer} from "../../../../src/messages/render/MessageRenderer";
import ListType = ListNode.ListType;
import BlockquoteType = BlockquoteNode.BlockquoteType;

describe("Given a simple document node", () => {
    describe("when rendering a message", () => {
        const formatMessage = function (message: string, attributes: string | null = null): string {
            return formatXml(`<betterchat-message ${attributes ?? ""}>${message.trim()}</betterchat-message>`);
        };
        afterEach(() => {
            Tooltips.destroyAll();
        });
        it("renders a string node correctly", () => {
            const document = new DocumentNode([
                new StringNode("string"),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<span>string</span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an url node with a valid link correctly", () => {
            const document = new DocumentNode([
                new UrlNode("https://example.com", [
                    new StringNode(`example.com`),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <a target="_blank" rel="noreferrer noopener" tabindex="-1" data-original-title="null" style="display: inline-block;" href="https://example.com">
                    <span>
                        example.com
                    </span>
                </a>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an url node with an invalid link correctly", () => {
            const document = new DocumentNode([
                new UrlNode("https://invalid.com[]"),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<a target="_blank" rel="noreferrer noopener" tabindex="-1" data-original-title="null" style="display: inline-block;" class="betterchat-invalid-link" href="https://invalid.com[]"></a>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a bold node correctly", () => {
            const document = new DocumentNode([
                new BoldNode([
                    new StringNode("bold text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <strong>
                    <span>
                        bold text
                    </span>
                </strong>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an underline node correctly", () => {
            const document = new DocumentNode([
                new UnderlineNode([
                    new StringNode("underlined text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <span style="text-decoration: underline;">
                    <span>
                        underlined text
                    </span>
                </span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an italic node correctly", () => {
            const document = new DocumentNode([
                new ItalicNode([
                    new StringNode("italic text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <em>
                    <span>
                        italic text
                    </span>
                </em>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a strikethrough node correctly", () => {
            const document = new DocumentNode([
                new StrikethroughNode([
                    new StringNode("strikethrough text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <del>
                    <span>
                        strikethrough text
                    </span>
                </del>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a color node correctly", () => {
            const document = new DocumentNode([
                new ColorNode("blue", [
                    new StringNode("blue text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <span style="color: blue;">
                    <span>
                        blue text
                    </span>
                </span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a spoiler node correctly", () => {
            const document = new DocumentNode([
                new SpoilerNode([
                    new StringNode("hidden text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <p class="spoiler has-tooltip" aria-hidden="true" data-original-title="null">
                    <span>
                        hidden text
                    </span>
                </p>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an inline code node correctly", () => {
            const document = new DocumentNode([
                new InlineCodeNode([
                    new StringNode("inline code"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <code class="inline-code">
                    <span>
                        inline code
                    </span>
                </code>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a code node correctly", () => {
            const document = new DocumentNode([
                new CodeNode(null, [
                    new StringNode("multiline code"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <code class="hljs">
                    <span>
                        multiline code
                    </span>
                </code>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an emoji node correctly", () => {
            const document = new DocumentNode([
                new EmojiNode(globalThis.document.createElement("emoji")),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<emoji></emoji>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a superscript node correctly", () => {
            const document = new DocumentNode([
                new SuperscriptNode([
                    new StringNode("superscript text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <sup>
                    <span>
                        superscript text
                    </span>
                </sup>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a subscript node correctly", () => {
            const document = new DocumentNode([
                new SubscriptNode([
                    new StringNode("subscript text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <sub>
                    <span>
                        subscript text
                    </span>
                </sub>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a details node correctly", () => {
            const document = new DocumentNode([
                new DetailsNode("summary text", [
                    new StringNode("details text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <details>
                    <summary>
                        summary text
                    </summary>
                    <span>details text</span>
                </details>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a thematic break node correctly", () => {
            const document = new DocumentNode([
                new ThematicBreakNode(),
            ]);
            const result = MessageRenderer.render(document);
            // noinspection HtmlExtraClosingTag
            const expected = `<hr></hr>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it.each<number>([1, 2, 3, 4, 5, 6])("renders a heading node of size %f correctly", (size) => {
            const document = new DocumentNode([
                new HeadingNode(size, [
                    new StringNode("heading"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<h${size}><span>heading</span></h${size}>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a center align node correctly", () => {
            const document = new DocumentNode([
                new CenterAlignNode([
                    new StringNode("centered text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<span style="display: flex; justify-content: center;"><span>centered text</span></span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected, "data-render-full-width=\"true\""));
        });
        it("renders a right align node correctly", () => {
            const document = new DocumentNode([
                new RightAlignNode([
                    new StringNode("right aligned text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<span style="display: flex; justify-content: right;"><span>right aligned text</span></span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected, "data-render-full-width=\"true\""));
        });
        it("renders a left align node correctly", () => {
            const document = new DocumentNode([
                new LeftAlignNode([
                    new StringNode("left aligned text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<span style="display: flex; justify-content: left;"><span>left aligned text</span></span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected, "data-render-full-width=\"true\""));
        });
        it("renders a highlight node correctly", () => {
            const document = new DocumentNode([
                new HighlightNode([
                    new StringNode("highlighted text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <span class="highlighted-text-snippet">
                    <span>
                        highlighted text
                    </span>
                </span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a footnote node correctly", () => {
            const document = new DocumentNode([
                new FootnoteNode([
                    new StringNode("footnote"),
                ]),
                new StringNode("additional content"),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <sup>1</sup>
                <span>
                    additional content
                </span>
                <hr>
                <sup>1</sup>
                <span>
                    <span>
                        footnote
                    </span>
                </span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (ordered) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.ORDERED, [
                    new ListItemNode([
                        new StringNode("item 1"),
                    ]),
                    new ListItemNode([
                        new StringNode("item 2"),
                    ]),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <ol>
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ol>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (unordered) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.UNORDERED, [
                    new ListItemNode([
                        new StringNode("item 1"),
                    ]),
                    new ListItemNode([
                        new StringNode("item 2"),
                    ]),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <ul>
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ul>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a table node correctly", () => {
            const document = new DocumentNode([
                new TableNode([
                    new TableRowNode([
                        new TableHeaderNode([
                            new StringNode("header 1"),
                        ]),
                        new TableHeaderNode([
                            new StringNode("header 2"),
                        ]),
                    ]),
                    new TableRowNode([
                        new TableDataNode([
                            new StringNode("value 1"),
                        ]),
                        new TableDataNode([
                            new StringNode("value 2"),
                        ]),
                    ]),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <table>
                    <tr>
                        <th>
                            <span>header 1</span>
                        </th>
                        <th>
                            <span>header 2</span>
                        </th>
                    </tr>
                    <tr>
                        <td>
                            <span>value 1</span>
                        </td>
                        <td>
                            <span>value 2</span>
                        </td>
                    </tr>
                </table>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a math node correctly", () => {
            const document = new DocumentNode([
                new MathNode([
                    new StringNode("9+10=21"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <span>
                    <span class="katex-display">
                        <span class="katex">
                            <span class="katex-html" aria-hidden="true">
                                <span class="base">
                                    <span class="strut" style="height: 0.7278em; vertical-align: -0.0833em;"></span>
                                    <span class="mord">
                                        9
                                    </span>
                                    <span class="mspace" style="margin-right: 0.2222em;"></span>
                                    <span class="mbin">
                                        +
                                    </span>
                                    <span class="mspace" style="margin-right: 0.2222em;"></span>
                                </span>
                                <span class="base">
                                    <span class="strut" style="height: 0.6444em;"></span>
                                    <span class="mord">
                                        10
                                    </span>
                                    <span class="mspace" style="margin-right: 0.2778em;"></span>
                                    <span class="mrel">
                                        =
                                    </span>
                                    <span class="mspace" style="margin-right: 0.2778em;"></span>
                                </span>
                                <span class="base">
                                    <span class="strut" style="height: 0.6444em;"></span>
                                    <span class="mord">
                                        21
                                    </span>
                                </span>
                            </span>
                        </span>
                    </span>
                </span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an inline math node correctly", () => {
            const document = new DocumentNode([
                new InlineMathNode([
                    new StringNode("9+10=21"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <span>
                    <span class="katex">
                        <span class="katex-html" aria-hidden="true">
                            <span class="base">
                                <span class="strut" style="height: 0.7278em; vertical-align: -0.0833em;"></span>
                                <span class="mord">9</span>
                                <span class="mspace" style="margin-right: 0.2222em;"></span>
                                <span class="mbin">+</span>
                                <span class="mspace" style="margin-right: 0.2222em;"></span>
                            </span>
                            <span class="base">
                                <span class="strut" style="height: 0.6444em;"></span>
                                <span class="mord">10</span>
                                <span class="mspace" style="margin-right: 0.2778em;"></span>
                                <span class="mrel">=</span>
                                <span class="mspace" style="margin-right: 0.2778em;"></span>
                            </span>
                            <span class="base">
                                <span class="strut" style="height: 0.6444em;"></span>
                                <span class="mord">21</span>
                            </span>
                        </span>
                    </span>
                </span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an blockquote node correctly", () => {
            const document = new DocumentNode([
                new BlockquoteNode("title", BlockquoteType.TIP, [
                    new StringNode("blockquote content"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <blockquote class="callout-tip">
                    <div class="blockquote-content-wrapper">
                        <p class="blockquote-title">
                            title
                        </p>
                        <span>blockquote content</span>
                    </div>
                </blockquote>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
    });
});
