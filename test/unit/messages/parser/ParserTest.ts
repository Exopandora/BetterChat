import {describe, expect, it} from "@jest/globals";
import {
    BoldNode,
    CodeNode,
    DocumentNode,
    ItalicNode,
    SpoilerNode,
    StrikethroughNode,
    StringNode,
    UrlNode
} from "../../../../src/messages/node/Node";
import {Parser} from "../../../../src/messages/parser/Parser";
import {StringToken, StyleToken, Token} from "../../../../src/messages/parser/Tokenizer";
import {Styles} from "../../../../src/messages/Styles";
// @ts-ignore
import {createEmojiToken, link} from "../../../fixtures/TestFixtures";

describe("Given a message element", () => {
    describe("when parsing", () => {
        type ParseTestParams = {
            innerHTML: string;
            expected: DocumentNode;
        };
        it.each<ParseTestParams>([
            {
                innerHTML: "<del><span>str[b]ike</span></del><span>through[/b]</span>",
                expected: new DocumentNode([
                    new StrikethroughNode([
                        new StringNode("str"),
                    ]),
                    new StrikethroughNode([
                        new BoldNode([
                            new StringNode("ike"),
                        ]),
                    ]),
                    new BoldNode([
                        new StringNode("through"),
                    ]),
                ]),
            },
            {
                innerHTML: "<del><span>spo[spoiler]iler</span></del><span>[/spoiler]</span>",
                expected: new DocumentNode([
                    new StrikethroughNode([
                        new StringNode("spo"),
                    ]),
                    new StrikethroughNode([
                        new SpoilerNode([
                            new StringNode("iler"),
                        ]),
                    ]),
                ]),
            },
            {
                innerHTML: "<del><span>spo[code]iler</span></del><span>[/code]</span>",
                expected: new DocumentNode([
                    new StringNode("~~spo"),
                    new CodeNode(null, [
                        new StringNode("iler~~"),
                    ]),
                ]),
            },
            {
                innerHTML: "<span>[i]italic[spoiler]text [/i] </span><a href=\"https://example.com\"><span>https://example.com</span></a><span> text[/spoiler]</span>",
                expected: new DocumentNode([
                    new ItalicNode([
                        new StringNode("italic"),
                    ]),
                    new SpoilerNode([
                        new ItalicNode([
                            new StringNode("text "),
                        ]),
                        new StringNode(" "),
                        new UrlNode("https://example.com", [
                            new StringNode("https://example.com"),
                        ]),
                        new StringNode(" text"),
                    ]),
                ]),
            },
        ])("returns the correct result for input $innerHTML", (params) => {
            const message = document.createElement("div");
            message.innerHTML = params.innerHTML;
            const result = Parser.parse(message);
            expect(result).toEqual(params.expected);
        });
    });
});

describe("Given an array of tokens", () => {
    describe("when merging consecutive string tokens", () => {
        it("returns the correct result", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StringToken("def"),
                new StringToken("ghi"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                new StringToken("jkl"),
            ];
            const expected = [
                new StringToken("abcdefghi"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                new StringToken("jkl"),
            ];
            const result = Parser.mergeConsecutiveStringTokens(tokens);
            expect(result).toEqual(expected);
        });
    });
    describe("when parsing URLs in string tokens", () => {
        it("parses URLs that span across the entire string token length", () => {
            const tokens: Token[] = [
                new StringToken("https://example.org"),
            ];
            const expected = [
                new StyleToken(Styles.URL, StyleToken.Type.START, "", false, "https://example.org"),
                new StringToken("https://example.org"),
                new StyleToken(Styles.URL, StyleToken.Type.END),
            ];
            link(expected, 0, 2);
            const result = Parser.parseUrlTokens(tokens);
            expect(result).toEqual(expected);
        });
        it("parses URLs that are at the end of a string token", () => {
            const tokens: Token[] = [
                new StringToken("prefix https://example.org"),
            ];
            const expected = [
                new StringToken("prefix "),
                new StyleToken(Styles.URL, StyleToken.Type.START, "", false, "https://example.org"),
                new StringToken("https://example.org"),
                new StyleToken(Styles.URL, StyleToken.Type.END),
            ];
            link(expected, 1, 3);
            const result = Parser.parseUrlTokens(tokens);
            expect(result).toEqual(expected);
        });
        it("parses URLs that are in the middle of a string token", () => {
            const tokens: Token[] = [
                new StringToken("prefix https://example.org suffix"),
            ];
            const expected = [
                new StringToken("prefix "),
                new StyleToken(Styles.URL, StyleToken.Type.START, "", false, "https://example.org"),
                new StringToken("https://example.org"),
                new StyleToken(Styles.URL, StyleToken.Type.END),
                new StringToken(" suffix"),
            ];
            link(expected, 1, 3);
            const result = Parser.parseUrlTokens(tokens);
            expect(result).toEqual(expected);
        });
        it("parses multiple URLs of a string token", () => {
            const tokens: Token[] = [
                new StringToken("prefix https://example.org middle https://example.org"),
            ];
            const expected = [
                new StringToken("prefix "),
                new StyleToken(Styles.URL, StyleToken.Type.START, "", false, "https://example.org"),
                new StringToken("https://example.org"),
                new StyleToken(Styles.URL, StyleToken.Type.END),
                new StringToken(" middle "),
                new StyleToken(Styles.URL, StyleToken.Type.START, "", false, "https://example.org"),
                new StringToken("https://example.org"),
                new StyleToken(Styles.URL, StyleToken.Type.END),
            ];
            link(expected, 1, 3);
            link(expected, 5, 7);
            const result = Parser.parseUrlTokens(tokens);
            expect(result).toEqual(expected);
        });
    });
    describe("when slicing overlapping style ranges", () => {
        it("returns the correct result", () => {
            const tokens: Token[] = [
                /*  0 */ new StringToken("abc"),
                /*  1 */ new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]", false, "value1"),
                /*  2 */ new StringToken("def"),
                /*  3 */ new StyleToken(Styles.ITALIC, StyleToken.Type.START, "[i]", false, "value2"),
                /*  4 */ new StringToken("ghi"),
                /*  5 */ new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START, "[s]", false, "value3"),
                /*  6 */ new StringToken("jkl"),
                /*  7 */ new StyleToken(Styles.BOLD, StyleToken.Type.END, "[/b]"),
                /*  8 */ new StringToken("mno"),
                /*  9 */ new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END, "[/s]"),
                /* 10 */ new StringToken("pqr"),
                /* 11 */ new StyleToken(Styles.ITALIC, StyleToken.Type.END, "[/i]"),
            ];
            link(tokens, 1, 7);
            link(tokens, 3, 11);
            link(tokens, 5, 9);
            const expected = [
                /*  0 */ new StringToken("abc"),
                /*  1 */ new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]", false, "value1"),
                /*  2 */ new StringToken("def"),
                /*  3 */ new StyleToken(Styles.BOLD, StyleToken.Type.END),

                /*  4 */ new StyleToken(Styles.BOLD, StyleToken.Type.START, "", false, "value1"),
                /*  5 */ new StyleToken(Styles.ITALIC, StyleToken.Type.START, "[i]", false, "value2"),
                /*  6 */ new StringToken("ghi"),
                /*  7 */ new StyleToken(Styles.ITALIC, StyleToken.Type.END),
                /*  8 */ new StyleToken(Styles.BOLD, StyleToken.Type.END),

                /*  9 */ new StyleToken(Styles.BOLD, StyleToken.Type.START, "", false, "value1"),
                /* 10 */ new StyleToken(Styles.ITALIC, StyleToken.Type.START, "", false, "value2"),
                /* 11 */ new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START, "[s]", false, "value3"),
                /* 12 */ new StringToken("jkl"),
                /* 13 */ new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END),
                /* 14 */ new StyleToken(Styles.ITALIC, StyleToken.Type.END),
                /* 15 */ new StyleToken(Styles.BOLD, StyleToken.Type.END, "[/b]"),

                /* 16 */ new StyleToken(Styles.ITALIC, StyleToken.Type.START, "", false, "value2"),
                /* 17 */ new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START, "", false, "value3"),
                /* 18 */ new StringToken("mno"),
                /* 19 */ new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END, "[/s]"),
                /* 20 */ new StyleToken(Styles.ITALIC, StyleToken.Type.END),

                /* 21 */ new StyleToken(Styles.ITALIC, StyleToken.Type.START, "", false, "value2"),
                /* 22 */ new StringToken("pqr"),
                /* 23 */ new StyleToken(Styles.ITALIC, StyleToken.Type.END, "[/i]"),
            ];
            link(expected, 1, 3);
            link(expected, 4, 8);
            link(expected, 5, 7);
            link(expected, 9, 15);
            link(expected, 10, 14);
            link(expected, 11, 13);
            link(expected, 16, 20);
            link(expected, 17, 19);
            link(expected, 21, 23);
            const result = Parser.sliceOverlappingStyleRanges(tokens);
            expect(result).toEqual(expected);
        });
        describe("", () => {
            it("when nested", () => {
                const tokens: Token[] = [
                    new StyleToken(Styles.SPOILER, StyleToken.Type.START, "[spoiler]"),
                    new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                    new StringToken("https://example.com"),
                    new StyleToken(Styles.BOLD, StyleToken.Type.END, "[/b]"),
                    new StyleToken(Styles.SPOILER, StyleToken.Type.END, "[/spoiler]"),
                ];
                link(tokens, 0, 4);
                link(tokens, 1, 3);
                const expected = [
                    new StyleToken(Styles.SPOILER, StyleToken.Type.START, "[spoiler]"),
                    new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                    new StringToken("https://example.com"),
                    new StyleToken(Styles.BOLD, StyleToken.Type.END, "[/b]"),
                    new StyleToken(Styles.SPOILER, StyleToken.Type.END, "[/spoiler]"),
                ];
                link(expected, 0, 4);
                link(expected, 1, 3);
                const result = Parser.sliceOverlappingStyleRanges(tokens);
                expect(result).toEqual(expected);
            });
            it("when overlapping before", () => {
                const tokens: Token[] = [
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START, "[s]"),
                    new StringToken("spo"),
                    new StyleToken(Styles.SPOILER, StyleToken.Type.START, "[spoiler]"),
                    new StringToken("iler"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END, "[/s]"),
                    new StyleToken(Styles.SPOILER, StyleToken.Type.END, "[/spoiler]"),
                ];
                link(tokens, 0, 4);
                link(tokens, 2, 5);
                const expected = [
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START, "[s]"),
                    new StringToken("spo"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END),
                    new StyleToken(Styles.SPOILER, StyleToken.Type.START, "[spoiler]"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START),
                    new StringToken("iler"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END, "[/s]"),
                    new StyleToken(Styles.SPOILER, StyleToken.Type.END, "[/spoiler]"),
                ];
                link(expected, 0, 2);
                link(expected, 3, 7);
                link(expected, 4, 6);
                const result = Parser.sliceOverlappingStyleRanges(tokens);
                expect(result).toEqual(expected);
            });
            it("when overlapping after", () => {
                const tokens: Token[] = [
                    new StyleToken(Styles.SPOILER, StyleToken.Type.START, "[spoiler]"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START, "[s]"),
                    new StringToken("spo"),
                    new StyleToken(Styles.SPOILER, StyleToken.Type.END, "[/spoiler]"),
                    new StringToken("iler"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END, "[/s]"),
                ];
                link(tokens, 0, 3);
                link(tokens, 1, 5);
                const expected = [
                    new StyleToken(Styles.SPOILER, StyleToken.Type.START, "[spoiler]"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START, "[s]"),
                    new StringToken("spo"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END),
                    new StyleToken(Styles.SPOILER, StyleToken.Type.END, "[/spoiler]"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START),
                    new StringToken("iler"),
                    new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END, "[/s]"),
                ];
                link(expected, 0, 4);
                link(expected, 1, 3);
                link(expected, 5, 7);
                const result = Parser.sliceOverlappingStyleRanges(tokens);
                expect(result).toEqual(expected);
            });
        });
    });
    describe("when applying nesting rule", () => {
        it("converts non string tokens into string tokens within forbidden nesting ranges and linked tokens before the range", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.CODE, StyleToken.Type.START, "[code]"),
                new StringToken("def"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.START, "[i]"),
                new StringToken("jkl"),
                new StyleToken(Styles.CODE, StyleToken.Type.END, "[/code]"),
                new StringToken("mno"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END, "[/i]"),
            ];
            link(tokens, 1, 5);
            link(tokens, 3, 7);
            const expected: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.CODE, StyleToken.Type.START, "[code]"),
                new StringToken("def[i]jkl"),
                new StyleToken(Styles.CODE, StyleToken.Type.END, "[/code]"),
                new StringToken("mno[/i]"),
            ];
            link(expected, 1, 3);
            const result = Parser.applyNestingRule(tokens);
            expect(result).toEqual(expected);
        });
        it("converts non string tokens into string tokens within forbidden nesting ranges and linked tokens after the range", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.START, "[i]"),
                new StringToken("def"),
                new StyleToken(Styles.CODE, StyleToken.Type.START, "[code]"),
                new StringToken("jkl"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END, "[/i]"),
                new StringToken("mno"),
                new StyleToken(Styles.CODE, StyleToken.Type.END, "[/code]"),
            ];
            link(tokens, 1, 5);
            link(tokens, 3, 7);
            const expected: Token[] = [
                new StringToken("abc[i]def"),
                new StyleToken(Styles.CODE, StyleToken.Type.START, "[code]"),
                new StringToken("jkl[/i]mno"),
                new StyleToken(Styles.CODE, StyleToken.Type.END, "[/code]"),
            ];
            link(expected, 1, 3);
            const result = Parser.applyNestingRule(tokens);
            expect(result).toEqual(expected);
        });
        it("converts non string tokens into string tokens within forbidden nesting ranges", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.CODE, StyleToken.Type.START, "[code]"),
                new StringToken("def"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.START, "[i]"),
                new StringToken("jkl"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END, "[/i]"),
                new StringToken("mno"),
                new StyleToken(Styles.CODE, StyleToken.Type.END, "[/code]"),
            ];
            link(tokens, 1, 7);
            link(tokens, 3, 5);
            const expected: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.CODE, StyleToken.Type.START, "[code]"),
                new StringToken("def[i]jkl[/i]mno"),
                new StyleToken(Styles.CODE, StyleToken.Type.END, "[/code]"),
            ];
            link(expected, 1, 3);
            const result = Parser.applyNestingRule(tokens);
            expect(result).toEqual(expected);
        });
        it("does not convert any non string tokens to string tokens outside of forbidden nesting ranges", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.START, "[i]"),
                new StringToken("def"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END, "[/i]"),
                new StringToken("jkl"),
                new StyleToken(Styles.CODE, StyleToken.Type.START, "[code]"),
                new StringToken("mno"),
                new StyleToken(Styles.CODE, StyleToken.Type.END, "[/code]"),
            ];
            link(tokens, 1, 3);
            link(tokens, 5, 7);
            const expected = tokens.slice();
            const result = Parser.applyNestingRule(tokens);
            expect(result).toEqual(expected);
        });
    });
    describe("when parsing nodes from tokens", () => {
        it("returns the correct result", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.START),
                new StringToken("def"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END),
                new StringToken("jkl"),
                new StyleToken(Styles.CODE, StyleToken.Type.START),
                new StringToken("mno"),
                new StyleToken(Styles.CODE, StyleToken.Type.END),
            ];
            link(tokens, 1, 3);
            link(tokens, 5, 7);
            const expected = [
                new StringNode("abc"),
                new ItalicNode([
                    new StringNode("def"),
                ]),
                new StringNode("jkl"),
                new CodeNode(null, [
                    new StringNode("mno"),
                ]),
            ];
            const result = Parser.parseNodes(tokens);
            expect(result).toEqual(expected);
        });
        it("removes empty style ranges", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.START),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END),
                new StringToken("nested"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.START),
                new StyleToken(Styles.BOLD, StyleToken.Type.START),
                new StyleToken(Styles.BOLD, StyleToken.Type.END),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END),
            ];
            link(tokens, 1, 2);
            link(tokens, 4, 7);
            link(tokens, 5, 6);
            const expected = [
                new StringNode("abcnested"),
            ];
            const result = Parser.parseNodes(tokens);
            expect(result).toEqual(expected);
        });
    });
    describe("when post processing a document node", () => {
        it("returns the correct result", () => {
            const document = new DocumentNode([
                new StringNode("abc"),
                new ItalicNode([
                    new StringNode("def"),
                ]),
                new StringNode("ghi"),
            ]);
            const expected = document;
            const result = Parser.postProcessDocumentNode(document);
            expect(result).toEqual(expected);
        });
    });
    describe("when linking style tokens", () => {
        it("returns the correct result", () => {
            // noinspection DuplicatedCode
            const tokens: Token[] = [
                new StyleToken(Styles.ITALIC, StyleToken.Type.START),
                new StringToken("abc"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END),
                new StringToken("def"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.START),
                new StyleToken(Styles.BOLD, StyleToken.Type.START),
                new StringToken("ghi"),
                new StyleToken(Styles.BOLD, StyleToken.Type.END),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END),
                new StringToken("jkl"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START),
                new StyleToken(Styles.BOLD, StyleToken.Type.START),
                new StringToken("ghi"),
                new StyleToken(Styles.BOLD, StyleToken.Type.END),
                new StyleToken(Styles.BOLD, StyleToken.Type.END),
            ];
            // noinspection DuplicatedCode
            const expected = [
                new StyleToken(Styles.ITALIC, StyleToken.Type.START),
                new StringToken("abc"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END),
                new StringToken("def"),
                new StyleToken(Styles.ITALIC, StyleToken.Type.START),
                new StyleToken(Styles.BOLD, StyleToken.Type.START),
                new StringToken("ghi"),
                new StyleToken(Styles.BOLD, StyleToken.Type.END),
                new StyleToken(Styles.ITALIC, StyleToken.Type.END),
                new StringToken("jkl"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START),
                new StyleToken(Styles.BOLD, StyleToken.Type.START),
                new StringToken("ghi"),
                new StyleToken(Styles.BOLD, StyleToken.Type.END),
                new StyleToken(Styles.BOLD, StyleToken.Type.END),
            ];
            link(expected, 0, 2);
            link(expected, 4, 8);
            link(expected, 5, 7);
            link(expected, 10, 14);
            link(expected, 11, 13);
            const result = Parser.linkStyleTokens(tokens);
            expect(result).toEqual(expected);
        });
    });
});

describe("Given two token arrays", () => {
    describe("when converting overlapping style tokens to string tokens", () => {
        it("returns the correct result", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.URL, StyleToken.Type.START, "[url=[b]]", false, "[b]"),
                new StringToken("def"),
                new StyleToken(Styles.URL, StyleToken.Type.END, "[/url]"),
            ];
            link(tokens, 1, 3);
            const others: Token[] = [
                new StringToken("abc"),
                new StringToken("[url="),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                new StringToken("]def[/url]"),
            ];
            const expected = [
                new StringToken("abc[url=[b]]def[/url]"),
            ];
            const result = Parser.convertOverlappingStyleTokensToStringTokens(tokens, others);
            expect(result).toEqual(expected);
        });
    });
    describe("when merging", () => {
        it("inserts style tokens from the second array into string tokens from the first array", () => {
            const tokens: Token[] = [
                new StringToken("abc[b]def"),
                new StyleToken(Styles.URL, StyleToken.Type.END, "[/url]"),
            ];
            const others: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                new StringToken("def"),
                new StyleToken(Styles.URL, StyleToken.Type.END, "[/url]"),
            ];
            const expected = [
                new StringToken("abc"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                new StringToken("def"),
                new StyleToken(Styles.URL, StyleToken.Type.END, "[/url]"),
            ];
            const result = Parser.mergeTokenArrays(tokens, others);
            expect(result).toEqual(expected);
        });
        it("prioritizes style tokens from the other array", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StyleToken(Styles.URL, StyleToken.Type.START, "[url=[b]]", false, "[b]"),
                new StringToken("def"),
                new StyleToken(Styles.URL, StyleToken.Type.END, "[/url]"),
                new StringToken("[b]"),
            ];
            link(tokens, 1, 3);
            const others: Token[] = [
                new StringToken("abc"),
                new StringToken("[url="),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                new StringToken("]def[/url]"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
            ];
            const expected = [
                new StringToken("abc[url="),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                new StringToken("]def[/url]"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
            ];
            const result = Parser.mergeTokenArrays(tokens, others);
            expect(result).toEqual(expected);
        });
        it("inserts style tokens from the first array into string tokens from the second array", () => {
            const tokens: Token[] = [
                new StringToken("ab[i]cd"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "~~"),
            ];
            const others: Token[] = [
                new StringToken("ab"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[i]"),
                new StringToken("cd~~"),
            ];
            const expected = [
                new StringToken("ab"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[i]"),
                new StringToken("cd"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "~~"),
            ];
            const result = Parser.mergeTokenArrays(tokens, others);
            expect(result).toEqual(expected);
        });
        it("handles emojis correctly", () => {
            const tokens: Token[] = [
                createEmojiToken("b"),
                new StringToken("lood"),
            ];
            const others: Token[] = [
                new StringToken(":b:lood"),
            ];
            const expected = [
                createEmojiToken("b"),
                new StringToken("lood"),
            ];
            const result = Parser.mergeTokenArrays(tokens, others);
            expect(result).toEqual(expected);
        });
        it("partitions string tokens correctly", () => {
            const tokens: Token[] = [
                new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START, "~~"),
                new StringToken("str[b]ike"),
                new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END, "~~"),
                new StringToken("through[/b]"),
            ];
            const others: Token[] = [
                new StringToken("~~str"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                new StringToken("ike~~through"),
                new StyleToken(Styles.BOLD, StyleToken.Type.END, "[/b]"),
            ];
            const expected = [
                new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.START, "~~"),
                new StringToken("str"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]"),
                new StringToken("ike"),
                new StyleToken(Styles.STRIKETHROUGH, StyleToken.Type.END, "~~"),
                new StringToken("through"),
                new StyleToken(Styles.BOLD, StyleToken.Type.END, "[/b]"),
            ];
            const result = Parser.mergeTokenArrays(tokens, others);
            expect(result).toEqual(expected);
        });
        // is this possible?
        // tokens: [ab c][def][ghi][jkl]
        // others:  ab[c  def  g]hi jkl
    });
});
