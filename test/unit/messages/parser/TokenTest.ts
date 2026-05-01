import {describe, expect, it} from "@jest/globals";
import {StringToken, StyleToken, Token, Tokens} from "../../../../src/messages/parser/Token";
import {Styles} from "../../../../src/messages/Styles";

describe("Given an array of tokens", () => {
    describe("when merging consecutive string tokens", () => {
        it("returns the correct result", () => {
            const tokens: Token[] = [
                new StringToken("abc"),
                new StringToken("def"),
                new StringToken("ghi"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, {string: "[b]"}),
                new StringToken("jkl"),
            ];
            const expected = [
                new StringToken("abcdefghi"),
                new StyleToken(Styles.BOLD, StyleToken.Type.START, {string: "[b]"}),
                new StringToken("jkl"),
            ];
            const result = Tokens.mergeConsecutiveStringTokens(tokens);
            expect(result).toEqual(expected);
        });
    });
});
