import {Tooltips} from "../../../../src/helpers/Tooltips";
import {
    BoldNode, CodeNode, ColorNode,
    DocumentNode, EmojiNode, InlineCodeNode,
    ItalicNode, SpoilerNode, StrikethroughNode,
    StringNode,
    UnderlineNode,
    UrlNode,
    Node
} from "../../../../src/messages/node/Node";
import {MessageRenderer} from "../../../../src/messages/render/MessageRenderer";
import {afterEach, describe, expect, it} from '@jest/globals';
import formatXml from "xml-formatter";

describe("Given a simple document node", () => {
    describe("when rendering a message", () => {
        afterEach(() => {
            Tooltips.destroyAll();
        });
        type RenderTestParams = {
            document: Node[],
            expected: string,
        };
        it.each<RenderTestParams>([
            {
                document: [new StringNode("string")],
                expected: `<span>string</span>`,
            },
            {
                document: [
                    new UrlNode("https://example.com", [
                        new StringNode("example.com"),
                    ])],
                expected: `
                    <a target="_blank" rel="noreferrer noopener" tabindex="-1" data-original-title="null" style="display: inline-block;" href="https://example.com">
                        <span>
                            example.com
                        </span>
                    </a>`,
            },
            {
                document: [new UrlNode("https://invalid.com[]")],
                expected: `<a target="_blank" rel="noreferrer noopener" tabindex="-1" data-original-title="null" style="display: inline-block;" class="betterchat-invalid-link" href="https://invalid.com[]"></a>`,
            },
            {
                document: [
                    new BoldNode([
                        new StringNode("bold text"),
                    ]),
                ],
                expected: `
                    <strong>
                        <span>
                            bold text
                        </span>
                    </strong>`,
            },
            {
                document: [
                    new UnderlineNode([
                        new StringNode("underlined text"),
                    ]),
                ],
                expected: `
                    <span style="text-decoration: underline;">
                        <span>
                            underlined text
                        </span>
                    </span>`,
            },
            {
                document: [new ItalicNode([
                    new StringNode("italic text"),
                ])],
                expected: `
                    <em>
                        <span>
                            italic text
                        </span>
                    </em>`,
            },
            {
                document: [
                    new StrikethroughNode([
                        new StringNode("strikethrough text"),
                    ]),
                ],
                expected: `
                    <del>
                        <span>
                            strikethrough text
                        </span>
                    </del>`,
            },
            {
                document: [
                    new ColorNode("blue", [
                        new StringNode("blue text"),
                    ]),
                ],
                expected: `
                    <span style="color: blue;">
                        <span>
                            blue text
                        </span>
                    </span>`,
            },
            {
                document: [
                    new SpoilerNode([
                        new StringNode("hidden text"),
                    ]),
                ],
                expected: `
                    <p class="spoiler has-tooltip" aria-hidden="true" data-original-title="null">
                        <span>
                            hidden text
                        </span>
                    </p>`,
            },
            {
                document: [
                    new InlineCodeNode([
                        new StringNode("inline code"),
                    ]),
                ],
                expected: `
                    <code class="inline-code">
                        <span>
                            inline code
                        </span>
                    </code>`,
            },
            {
                document: [
                    new CodeNode(null, [
                        new StringNode("multiline code"),
                    ]),
                ],
                expected: `
                    <code class="hljs">
                        <span>
                            multiline code
                        </span>
                    </code>`,
            },
            {
                document: [new EmojiNode(document.createElement("emoji"))],
                expected: `<emoji></emoji>`,
            },
        ])("returns the correct result for input $document", (params) => {
            const document = new DocumentNode(params.document);
            const result = MessageRenderer.render(document);
            const expected = formatXml(`<betterchat-message>${params.expected.trim()}</betterchat-message>`);
            expect(formatXml(result.outerHTML)).toEqual(expected);
        });
    });
});
