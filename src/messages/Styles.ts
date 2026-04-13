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
    readonly isStandalone: boolean;

    constructor(
        name: String,
        valueValidator: (value: string | null) => boolean,
        options: {
            allowsNesting?: boolean,
            allowsSlicing?: boolean ,
            isStandalone?: boolean,
        } = {},
    ) {
        this.name = name;
        this.isValidValue = valueValidator;
        this.allowsNesting = options.allowsNesting ?? true;
        this.allowsSlicing = options.allowsSlicing ?? true;
        this.isStandalone = options.isStandalone ?? false;
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
    export const THEMATIC_BREAK = new Style("thematic break", isNull, {isStandalone : true});
    export const HEADING_1 = new Style("heading 1", isNull, {allowsSlicing: false});
    export const HEADING_2 = new Style("heading 2", isNull, {allowsSlicing: false});
    export const HEADING_3 = new Style("heading 3", isNull, {allowsSlicing: false});
    export const HEADING_4 = new Style("heading 4", isNull, {allowsSlicing: false});
    export const HEADING_5 = new Style("heading 5", isNull, {allowsSlicing: false});
    export const HEADING_6 = new Style("heading 6", isNull, {allowsSlicing: false});
    export const CENTER = new Style("center align", isNull, {allowsSlicing: false});
    export const RIGHT = new Style("right align", isNull, {allowsSlicing: false});
    export const LEFT = new Style("left align", isNull, {allowsSlicing: false});
    export const HIGHLIGHT = new Style("highlight", isNull);

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
        ["hr", THEMATIC_BREAK],
        ["h1", HEADING_1],
        ["h2", HEADING_2],
        ["h3", HEADING_3],
        ["h4", HEADING_4],
        ["h5", HEADING_5],
        ["h6", HEADING_6],
        ["center", CENTER],
        ["left", LEFT],
        ["right", RIGHT],
        ["highlight", HIGHLIGHT],
    ]);

    export function fromBBCode(code: string): Style | null {
        return BBCODE_TO_STYLE.get(code.toLowerCase()) ?? null;
    }
}
