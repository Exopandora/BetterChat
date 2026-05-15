import {afterEach, describe, expect, it, jest} from '@jest/globals';
import formatXml from "xml-formatter";
import {Tooltips} from "../../../../src/helpers/Tooltips";
import {translate} from "../../../../src/helpers/Util";
import {
    BlockquoteNode,
    BoldNode,
    CenterAlignNode,
    CodeNode,
    ColorNode,
    DetailsContentNode,
    DetailsNode,
    DetailsSummaryNode,
    DocumentNode,
    EmojiNode,
    FootnoteNode,
    HeadingNode,
    HighlightNode,
    InlineCodeNode,
    InlineMathNode,
    ItalicNode,
    JustifyAlignNode,
    LeftAlignNode,
    ListItemNode,
    ListNode,
    MathNode,
    MermaidNode,
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
import BlockquoteType = BlockquoteNode.BlockquoteType;
import ListType = ListNode.ListType;

jest.mock("../../../../src/helpers/Util", () => ({
    ...jest.requireActual<typeof import("../../../../src/helpers/Util")>("../../../../src/helpers/Util"),
    translate: jest.fn(),
}));

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
        it("renders a url node with a valid link correctly", () => {
            const document = new DocumentNode([
                new UrlNode("https://example.com", [
                    new StringNode(`example.com`),
                ]),
            ]);
            (translate as jest.Mock<typeof translate>).mockReturnValue("Links to: https://example.com");
            const result = MessageRenderer.render(document);
            const expected = `
                <a target="_blank" rel="noreferrer noopener" tabindex="-1" class="ts-parsed-link" href="https://example.com">
                    <span>
                        example.com
                    </span>
                </a>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a url node with an invalid link correctly", () => {
            const document = new DocumentNode([
                new UrlNode("https://invalid.com[]"),
            ]);
            (translate as jest.Mock<typeof translate>).mockReturnValue("Links to: https://invalid.com[]");
            const result = MessageRenderer.render(document);
            const expected = `<a target="_blank" rel="noreferrer noopener" tabindex="-1" class="betterchat-invalid-link" href="https://invalid.com[]"></a>`;
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
            const expected = `<u><span>underlined text</span></u>`;
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
                <span class="md-spoiler">
                    <span>
                        hidden text
                    </span>
                </span>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an inline code node correctly", () => {
            const document = new DocumentNode([
                new InlineCodeNode([
                    new StringNode("inline code"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<code><span>inline code</span></code>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a code node correctly", () => {
            const document = new DocumentNode([
                new CodeNode(null, [
                    new StringNode("multiline code"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const base64encodedCode = btoa("multiline code")
            const expected = `<pre><code class="cm-highlighted" data-code="${base64encodedCode}"><span>multiline code</span></code></pre>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an emoji node correctly", () => {
            const document = new DocumentNode([
                new EmojiNode(globalThis.document.createElementNS("http://www.w3.org/2000/svg", "svg")),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<svg></svg>`;
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
                new DetailsNode([
                    new DetailsSummaryNode([
                        new StringNode("summary text"),
                    ]),
                    new DetailsContentNode([
                        new StringNode("details text"),
                    ]),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <details class="md-details-preview">
                    <summary>
                        <span>
                            summary text
                        </span>
                    </summary>
                    <div class="md-details-content">
                        <span>details text</span>
                    </div>
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
            // noinspection XmlDeprecatedElement,HtmlDeprecatedTag
            const expected = `<center class="md-align-block"><span>centered text</span></center>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a right align node correctly", () => {
            const document = new DocumentNode([
                new RightAlignNode([
                    new StringNode("right aligned text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<div class="md-align-block" style="text-align: right;"><span>right aligned text</span></div>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a left align node correctly", () => {
            const document = new DocumentNode([
                new LeftAlignNode([
                    new StringNode("left aligned text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<div class="md-align-block" style="text-align: left;"><span>left aligned text</span></div>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a justify align node correctly", () => {
            const document = new DocumentNode([
                new JustifyAlignNode([
                    new StringNode("justified text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `<div class="md-align-block" style="text-align: justify;"><span>justified text</span></div>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a highlight node correctly", () => {
            const document = new DocumentNode([
                new HighlightNode([
                    new StringNode("highlighted text"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <mark class="md-highlight">
                    <span>
                        highlighted text
                    </span>
                </mark>`;
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
                <section class="md-footnotes">
                    <ol>
                        <li>
                            <span>footnote</span>
                        </li>
                    </ol>
                </section>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (disc type) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.DISC, [
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
                <ul class="betterchat-list-style-type-disc">
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ul>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (circle type) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.CIRCLE, [
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
                <ul class="betterchat-list-style-type-circle">
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ul>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (square type) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.SQUARE, [
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
                <ul class="betterchat-list-style-type-square">
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ul>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (decimal type) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.DECIMAL, [
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
                <ol class="betterchat-list-style-type-decimal">
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ol>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (lower roman type) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.LOWER_ROMAN, [
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
                <ol class="betterchat-list-style-type-lower-roman">
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ol>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (upper roman type) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.UPPER_ROMAN, [
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
                <ol class="betterchat-list-style-type-upper-roman">
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ol>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (lower alpha type) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.LOWER_ALPHA, [
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
                <ol class="betterchat-list-style-type-lower-alpha">
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ol>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a list node (upper alpha type) correctly", () => {
            const document = new DocumentNode([
                new ListNode(ListType.UPPER_ALPHA, [
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
                <ol class="betterchat-list-style-type-upper-alpha">
                    <li>
                        <span>item 1</span>
                    </li>
                    <li>
                        <span>item 2</span>
                    </li>
                </ol>`;
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
                <table class="md-table">
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
                <div class="md-offline-math-preview" data-math-source="9+10=21">
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
                </div>`;
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
        it("renders a blockquote node correctly", () => {
            const document = new DocumentNode([
                new BlockquoteNode(null, BlockquoteType.DEFAULT, [
                    new StringNode("blockquote content"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <blockquote>
                    <span>blockquote content</span>
                </blockquote>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a blockquote node (note callout) correctly", () => {
            const document = new DocumentNode([
                new BlockquoteNode("title", BlockquoteType.NOTE, [
                    new StringNode("note content"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <blockquote class="md-callout md-callout-note" data-callout="note">
                    <div class="md-callout-title">
                        title
                    </div>
                    <span>note content</span>
                </blockquote>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders a blockquote node (tip callout) correctly", () => {
            const document = new DocumentNode([
                new BlockquoteNode("title", BlockquoteType.TIP, [
                    new StringNode("tip content"),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <blockquote class="md-callout md-callout-tip" data-callout="tip">
                    <div class="md-callout-title">
                        title
                    </div>
                    <span>tip content</span>
                </blockquote>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
        it("renders an mermaid node correctly", () => {
            const diagramSource = `sequenceDiagram
                            Alice->>+John: Hello John, how are you?
                            Alice->>+John: John, can you hear me?
                            John-->>-Alice: Hi Alice, I can hear you!
                            John-->>-Alice: I feel great!`;
            const document = new DocumentNode([
                new MermaidNode([
                    new StringNode(diagramSource),
                ]),
            ]);
            const result = MessageRenderer.render(document);
            const expected = `
                <div class="md-offline-mermaid-preview" data-mermaid-source="${diagramSource.trim()}">
                    <div class="md-mermaid-meta-bar">Diagram</div>
                    <pre class="language-mermaid">sequenceDiagram
                            Alice-&gt;&gt;+John: Hello John, how are you?
                            Alice-&gt;&gt;+John: John, can you hear me?
                            John--&gt;&gt;-Alice: Hi Alice, I can hear you!
                            John--&gt;&gt;-Alice: I feel great!</pre>
                </div>`;
            expect(formatXml(result.outerHTML)).toEqual(formatMessage(expected));
        });
    });
});
