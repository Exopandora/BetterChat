import {describe, expect, it} from "@jest/globals";
import {Styles} from "../../../../src/messages/Styles";
import {StringToken, StyleToken} from "../../../../src/messages/parser/Token";
import {Tokenizer} from "../../../../src/messages/parser/Tokenizer";

describe("Given a simple string", () => {
    describe("when tokenizing", () => {
        it("returns the correct result", () => {
            const result = Tokenizer.tokenizeString("abc[color=white]def[/color][b]");
            const expected = [
                new StringToken("abc"),
                new StyleToken(Styles.COLOR, StyleToken.Type.START, {string: "[color=white]", value: "white"}),
                new StringToken("def"),
                new StyleToken(Styles.COLOR, StyleToken.Type.END, {string: "[/color]"}),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, {string: "[b]"}),
            ];
            expect(result).toEqual(expected);
        });
        it("parses quoted tag values correctly", () => {
            const result = Tokenizer.tokenizeString("[code=\"lang\\\"uage\"]");
            const expected = [
                new StyleToken(Styles.CODE, StyleToken.Type.START, {string: "[code=\"lang\\\"uage\"]", value: "lang\"uage"}),
            ];
            expect(result).toEqual(expected);
        });
    });
});

describe("Given a string containing an escaped tag", () => {
    describe("when tokenizing", () => {
        it("returns the correct result", () => {
            const result = Tokenizer.tokenizeString("abc\\[b]def");
            const expected = [
                new StringToken("abc"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, {string: "\\[b]", escaped: true}),
                new StringToken("def"),
            ];
            expect(result).toEqual(expected);
        });
    });
});
