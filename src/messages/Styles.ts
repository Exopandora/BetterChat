const cssColors = [
    "AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure",
    "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood",
    "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan",
    "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid",
        "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue",
        "DimGray", "DodgerBlue",
    "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite",
    "Gold", "GoldenRod", "Gray", "Green", "GreenYellow",
    "HoneyDew", "HotPink", "IndianRed",
    "Indigo", "Ivory",
    "Khaki",
    "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGrey",
        "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSteelBlue", "LightYellow",
        "Lime", "LimeGreen", "Linen",
    "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue",
        "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin",
    "NavajoWhite", "Navy",
    "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid",
    "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple",
    "Red", "RosyBrown", "RoyalBlue",
    "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "Snow",
        "SpringGreen", "SteelBlue",
    "Tan", "Teal", "Thistle", "Tomato", "Turquoise",
    "Violet",
    "Wheat", "White", "WhiteSmoke",
    "Yellow", "YellowGreen",
].map(color => color.toLowerCase());

export class Style {
    readonly name: String;
    readonly isValidValue: (value: string | null) => boolean;
    readonly allowsNesting: boolean;
    readonly allowsSlicing: boolean;

    constructor(
        name: String,
        valueValidator: (value: string | null) => boolean,
        options: { allowsNesting?: boolean, allowsSlicing?: boolean } = {},
    ) {
        this.name = name;
        this.isValidValue = valueValidator;
        this.allowsNesting = options.allowsNesting ?? true;
        this.allowsSlicing = options.allowsSlicing ?? true;
    }
}

export namespace Styles {
    export const URL = new Style("url", isValidUrl, {allowsSlicing: false});
    export const BOLD = new Style("bold", isNull);
    export const UNDERLINE = new Style("underline", isNull);
    export const ITALIC = new Style("italic", isNull);
    export const STRIKETHROUGH = new Style("strikethrough", isNull);
    export const COLOR = new Style("color", isValidColor);
    export const SPOILER = new Style("spoiler", isNull, {allowsSlicing: false});
    export const CODE = new Style("code", isAny, {allowsNesting: false});
    export const PRE = new Style("pre", isNull, {allowsNesting: false});
    export const SUPERSCRIPT = new Style("superscript", isNull);
    export const SUBSCRIPT = new Style("subscript", isNull);
    export const DETAILS = new Style("details", isAny, {allowsSlicing: false});

    function isValidColor(color: string | null): boolean {
        return color != null && (cssColors.includes(color.toLowerCase()) || color.match(/^#(?:[a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/) != null);
    }

    function isValidUrl(url: string | null): boolean {
        return url == null || url.match(/\S+:\/\/\S+/) != null;
    }

    function isNull(value: string | null): boolean {
        return value == null;
    }

    function isAny(_: string | null): boolean {
        return true;
    }

    const BBCODE_TO_STYLE = new Map<string, Style>([
        ["url", URL],
        ["b", BOLD],
        ["u", UNDERLINE],
        ["i", ITALIC],
        ["s", STRIKETHROUGH],
        ["color", COLOR],
        ["spoiler", SPOILER],
        ["code", CODE],
        ["pre", PRE],
        ["sup", SUPERSCRIPT],
        ["sub", SUBSCRIPT],
        ["details", DETAILS],
    ]);

    export function fromBBCode(code: string): Style | null {
        return BBCODE_TO_STYLE.get(code.toLowerCase()) ?? null;
    }
}
