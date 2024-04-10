const bbCodes = (function() {
	class BBCode {
		constructor(code, suppressNested = false, valueValidator = null) {
			this.code = code;
			this.suppressNested = suppressNested;
			this.valueValidator = valueValidator;
		}
		
		isValidValue(value) {
			return this.valueValidator ? this.valueValidator(value) : value == null;
		}
	}
	
	const cssColors = [
		"AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black",
		"BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate",
		"Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod",
		"DarkGray", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid", "DarkRed",
		"DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue",
		"DimGray", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite",
		"Gold", "GoldenRod", "Gray", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed",
		"Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue",
		"LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen",
		"LightSkyBlue", "LightSlateGray", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta",
		"Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen",
		"MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy",
		"OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen",
		"PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue",
		"Purple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen",
		"SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "Snow", "SpringGreen",
		"SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat",
		"White", "WhiteSmoke", "Yellow", "YellowGreen"
	].map(color => color.toLowerCase());
	
	const bbCodes = {
		url: new BBCode("url", false, value => value == null || value.match(/\S+:\/\/\S+/)),
		bold: new BBCode("b"),
		underline: new BBCode("u"),
		italic: new BBCode("i"),
		strike: new BBCode("s"),
		color: new BBCode("color", false, value => value != null && (cssColors.includes(value.toLowerCase()) || value.match(/^#(?:[a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/))),
		spoiler: new BBCode("spoiler"),
		code: new BBCode("code", true),
		pre: new BBCode("pre", true)
	};
	
	return bbCodes;
})();

const bbCodeMap = (function() {
	const map = new Map();
	for(const bbCode of Object.values(bbCodes)) {
		map.set(bbCode.code, bbCode);
	}
	return map;
})();
