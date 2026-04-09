import {describe, expect, it} from "@jest/globals";
import {StringToken, StyleToken, Tokenizer} from "../../../../src/messages/parser/Tokenizer";
import {Styles} from "../../../../src/messages/Styles";

describe("Given a simple string", () => {
    describe("when tokenizing", () => {
        it("returns the correct result", () => {
            const result = Tokenizer.tokenizeString("abc[color=white]def[/color][b]");
            const expected = [
                new StringToken("abc"),
                new StyleToken(Styles.COLOR, StyleToken.Type.START, "[color=white]", false, "white"),
                new StringToken("def"),
                new StyleToken(Styles.COLOR, StyleToken.Type.END, "[/color]", false, null),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "[b]", false, null),
            ]
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
                new StyleToken(Styles.BOLD, StyleToken.Type.START, "\\[b]", true, null),
                new StringToken("def"),
            ]
            expect(result).toEqual(expected);
        });
    });
});
