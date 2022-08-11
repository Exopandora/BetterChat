(function() {
	const imagePreviewWidthPct = 0.65;
	const imagePreviewHeightPct = 0.65;
	const twitterEmbedTheme = "dark";
	const tippyDefaultProps = {
		delay: 150,
		duration: 150,
		arrow: "<div class=\"tooltip-arrow\" style=\"margin: 0px;\"></div>",
		offset: [0, 0],
		maxWidth: "none",
		onCreate(instance) {
			const box = instance.popper.querySelector(".tippy-box");
			if(box != null && !box.classList.contains("tooltip")) {
				box.classList.add("tooltip");
				box.setAttribute("x-placement", "top");
			}
			const content = instance.popper.querySelector(".tippy-content");
			if(content != null && !content.classList.contains("tooltip-inner")) {
				content.classList.add("tooltip-inner");
			}
		}
	};
	
	class BBCode {
		constructor(code, isNesting, valueValidator, htmlFormatter) {
			this.code = code;
			this.isNesting = isNesting;
			this.valueValidator = valueValidator;
			this.htmlFormatter = htmlFormatter;
		}
		
		isValidValue(value) {
			return this.valueValidator ? this.valueValidator(value) : value == null;
		}
		
		applyStyle(element, value) {
			return this.htmlFormatter(element, value);
		}
	}
	
	class BBTag {
		constructor(bbCode, bbValue, ignore, isClosingTag, start, end) {
			this.bbCode = bbCode;
			this.bbValue = bbValue;
			this.ignore = ignore;
			this.isClosingTag = isClosingTag;
			this.start = start;
			this.end = end;
		}
	}
	
	class BBSection {
		constructor(id, bbCode, value, ignore, openingTagStart, openingTagEnd, closingTagStart, closingTagEnd) {
			this.id = id;
			this.bbCode = bbCode;
			this.value = value;
			this.ignore = ignore;
			this.openingTagStart = openingTagStart;
			this.openingTagEnd = openingTagEnd;
			this.closingTagStart = closingTagStart;
			this.closingTagEnd = closingTagEnd;
		}
	}
	
	class StringReader {
		constructor(string, cursor=0) {
			this.string = string;
			this.cursor = cursor;
		}
		
		canRead(offset=1) {
			return this.cursor + offset <= this.string.length;
		}
		
		peek(offset=0) {
			return this.string.charAt(this.cursor + offset);
		}
		
		read() {
			return this.string.charAt(this.cursor++);
		}
		
		skip() {
			this.cursor++;
		}
		
		copy() {
			return new StringReader(this.string, this.cursor);
		}
	}
	
	class Settings {
		constructor() {
			this.defaults = {};
			this.configureDefaults();
			this.userPreferences = {...this.defaults};
		}
		
		configName() {
			return "betterchat";
		}
		
		configureDefaults() {
			this.defaults.enabled = true;
			this.defaults.chatStyling = true;
			this.defaults.embeds = true;
		}
		
		saveConfiguration() {
			tsclient_internal.saveJsonBlob(this.configName(), JSON.stringify(this.userPreferences));
		}
		
		populateSettings(callback) {
			tsclient_internal.getJsonBlob(this.configName(), (err, json) => {
				if(0 === err && json.length > 0) {
					this.userPreferences = JSON.parse(json);
					for(const key in this.defaults) {
						if(!(key in this.userPreferences)) {
							this.userPreferences[key] = this.defaults[key];
						}
					}
				}
				callback();
			});
		}
		
		getValueForKey(key) {
			return this.userPreferences[key];
		}
		
		setValueForKey(key, value) {
			this.userPreferences[key] = value;
			this.saveConfiguration();
		}
	}
	
	class Attachment {
		constructor(node) {
			this.node = node;
		}
		
		newInstance() {
			return this.node.cloneNode(true);
		}
	}
	
	class MultimediaAttachment extends Attachment {
		constructor(node) {
			super(node);
		}
		
		newInstance() {
			const container = document.createElement("div");
			var element;
			if(this.node.videoWidth == 0 && this.node.videoHeight == 0) {
				element = document.createElement("audio");
			} else {
				element = document.createElement("video");
				container.classList.add("ts-attachment-video-content");
			}
			element.style.height = "100%";
			element.style.width = "100%";
			element.setAttribute("controls", "");
			element.src = this.node.src;
			container.appendChild(element);
			return container;
		}
	}
	
	class TwitterAttachment extends Attachment {
		constructor(node) {
			super(node);
		}
		
		newInstance() {
			const node = super.newInstance();
			twttr.widgets.load(node.firstChild);
			return node;
		}
	}
	
	class ImageAttachment extends Attachment {
		constructor(node, url, naturalWidth, naturalHeight) {
			super(node);
			this.url = url;
			this.naturalWidth = naturalWidth;
			this.naturalHeight = naturalHeight;
		}
		
		newInstance() {
			const node = super.newInstance();
			node.onclick = event => {
				showImagePreview(this.url, this.naturalWidth, this.naturalHeight);
				event.stopPropagation();
				event.preventDefault();
			};
			return node;
		}
	}
	
	const settings = new Settings();
	const cssColors = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"].map(color => color.toLowerCase());
	const tooltipManager = {
		tooltips: [],
		createTooltip(element, text) {
			this.tooltips.push(tippy(element, {content: text}));
			return this.suppressChildTooltips(element);
		},
		destroyTooltip(element) {
			if(element._tippy) {
				element._tippy.destroy();
			}
			const index = this.tooltips.indexOf(element._tippy);
			if(index > -1) {
				array.splice(index, 1);
			}
		},
		destroyAll() {
			while(this.tooltips.length > 0) {
				const tooltip = this.tooltips.pop();
				if(tooltip._tippy) {
					tooltip.destroy();
				}
			}
		},
		suppressChildTooltips(element) {
			const childTooltips = [];
			for(const child of element.childNodes) {
				if(child._tippy) {
					child._tippy.disable();
					childTooltips.push(child);
				}
				childTooltips.push(...this.suppressChildTooltips(child));
			}
			return childTooltips;
		}
	};
	const attachmentCache = new Map();
	
	function gatherMessageContents(node) {
		var text = "";
		var emojis = [];
		for(const childNode of node.childNodes) {
			if(childNode.tagName == "A") {
				text += childNode.textContent;
			} else if(childNode.tagName == "STRONG") {
				text += "[b]" + childNode.textContent + "[/b]";
			} else if(childNode.tagName == "DEL") {
				text += "[s]" + childNode.textContent + "[/s]";
			} else if(childNode.tagName == "EM") {
				text += "[i]" + childNode.textContent + "[/i]";
			} else if(childNode.tagName == "P" && childNode.classList.contains("spoiler")) {
				const childContents = gatherMessageContents(childNode);
				for(const emoji of childContents.emojis) {
					emojis.push({
						index: text.length + emoji.index,
						node: emoji.node
					});
				}
				text += "[spoiler]" + childContents.text + "[/spoiler]";
			} else if(childNode.tagName == "PRE") {
				text += "[code]" + childNode.textContent + "[/code]";
			} else if(childNode.tagName == "IMG" && childNode.dataset.type == "emoji") {
				emojis.push({
					index: text.length,
					node: childNode
				});
			} else {
				text += childNode.textContent;
			}
		}
		return {text, emojis};
	}
	
	function setClipboardString(text) {
		const element = document.createElement("textarea");
		element.value = text;
		document.body.appendChild(element);
		element.select();
		document.execCommand("copy");
		document.body.removeChild(element);
	}
	
	function createText(text) {
		const span = document.createElement("span");
		span.textContent = text;
		return span;
	}
	
	function applyUrlFormatting(elements, value) {
		const a = document.createElement("a");
		a.target = "_blank";
		a.rel = "noreferrer noopener";
		a.tabIndex = -1;
		a.dataset.originalTitle = null;
		a.style.display = "inline-block";
		for(const element of elements) {
			a.appendChild(element);
		}
		var href = value || a.textContent;
		if(href.match(/^\w+:\/\/\S+$/) == null) {
			href = "https://" + href;
		}
		const invalid = href.match(/^((?:(?:(?:https?|ts3file|ts3server|teamspeak):\/\/)|(?:www\.))[^\s<>\[\]]+[^<>.,:;"')\[\]\s])$/) == null;
		if(invalid) {
			a.classList.add("betterchat-invalid-link");
		}
		a.href = href;
		a.onclick = event => {
			if(invalid) {
				setClipboardString(a.href);
				if(a._tippy) {
					a._tippy.hide();
					a._tippy.setContent("Copied to clipboard!");
					a._tippy.setProps({
						...tippyDefaultProps,
						onHidden(instance) {
							instance.setContent("Links to: " + href);
							instance.setProps(tippyDefaultProps);
						}
					});
					a._tippy.show();
				}
			} else {
				window.open(href);
			}
			event.stopPropagation();
			event.preventDefault();
		};
		tooltipManager.createTooltip(a, "Links to: " + href);
		return a;
	}
	
	function applyBoldFormatting(element, value) {
		const strong = document.createElement("strong");
		strong.appendChild(element);
		return strong;
	}
	
	function applyUnderlineFormatting(element, value) {
		const span = document.createElement("span");
		span.style.textDecoration = "underline";
		span.appendChild(element);
		return span;
	}
	
	function applyItalicFormatting(element, value) {
		const em = document.createElement("em");
		em.appendChild(element);
		return em;
	}
	
	function applyStrikeFormatting(element, value) {
		const del = document.createElement("del");
		del.appendChild(element);
		return del;
	}
	
	function applyColorFormatting(element, value) {
		const span = document.createElement("span");
		span.style.color = value;
		span.appendChild(element);
		return span;
	}
	
	function applySpoilerFormatting(elements, value) {
		const p = document.createElement("p");
		p.classList.add("spoiler");
		p.classList.add("has-tooltip");
		p.ariaHidden = true;
		p.dataset.originalTitle = null;
		for(const element of elements) {
			p.appendChild(element);
		}
		const childTooltips = tooltipManager.createTooltip(p, "Click to reveal spoiler");
		p.onclick = event => {
			p.setAttribute("visible", true);
			tooltipManager.destroyTooltip(p);
			for(const childTooltip of childTooltips) {
				if(childTooltip._tippy) {
					childTooltip._tippy.enable();
				}
			}
			event.stopPropagation();
			event.preventDefault();
		};
		return p;
	}
	
	function applyCodeFormatting(element) {
		const pre = document.createElement("pre");
		const code = document.createElement("code");
		code.appendChild(element);
		pre.appendChild(code);
		hljs.highlightElement(code);
		return pre;
	}
	
	const bbCodes = {
		url: new BBCode("url", true, value => value == null || value.match(/\S+:\/\/\S+/), applyUrlFormatting),
		bold: new BBCode("b", false, null, applyBoldFormatting),
		underline: new BBCode("u", false, null, applyUnderlineFormatting),
		italic: new BBCode("i", false, null, applyItalicFormatting),
		strike: new BBCode("s", false, null, applyStrikeFormatting),
		color: new BBCode("color", false, value => cssColors.includes(value.toLowerCase()) || value.match(/^#(?:[a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/), applyColorFormatting),
		spoiler: new BBCode("spoiler", true, null, applySpoilerFormatting),
		code: new BBCode("code", false, null, applyCodeFormatting)
	};
	const bbCodeMap = createBBCodeMap();
	
	function createBBCodeMap() {
		const map = new Map();
		for(const bbCode of Object.values(bbCodes)) {
			map.set(bbCode.code, bbCode);
		}
		return map;
	}
	
	function isAllowedBBCodeChar(char) {
		return char != '[' && char != ']' && char != '=';
	}
	
	function isAllowedBBCodeValueChar(char) {
		return char != '[' && char != ']';
	}
	
	function locateBBTags(message) {
		var bbTags = [];
		const reader = new StringReader(message);
		while(reader.canRead()) {
			if(reader.read() != '[') {
				continue;
			}
			//try parse bbcode tag
			const ignore = reader.cursor > 1 && reader.peek(-2) == '\\';
			const tagReader = reader.copy();
			const isClosingTag = tagReader.canRead() && tagReader.peek() == '/';
			if(isClosingTag) {
				tagReader.skip();
			}
			while(tagReader.canRead() && isAllowedBBCodeChar(tagReader.peek())) {
				tagReader.skip();
			}
			var bbCode = null;
			var bbValue = null;
			if(!isClosingTag && tagReader.canRead() && tagReader.peek() == '=') { //parse value
				const valueReader = tagReader.copy();
				valueReader.skip();
				while(valueReader.canRead() && isAllowedBBCodeValueChar(valueReader.peek())) {
					valueReader.skip();
				}
				if(valueReader.canRead() && valueReader.peek() == ']') {
					bbCode = message.substring(reader.cursor, tagReader.cursor).toLowerCase();
					bbValue = message.substring(tagReader.cursor + 1, valueReader.cursor);
					tagReader.cursor = valueReader.cursor;
				}
			} else if(tagReader.canRead() && tagReader.peek() == ']') { //bbcode tag found
				bbCode = message.substring(reader.cursor + isClosingTag, tagReader.cursor).toLowerCase();
			}
			if(bbCode != null && bbCodeMap.has(bbCode)) { //validate parsed result
				const bbCodeInstance = bbCodeMap.get(bbCode);
				if(isClosingTag && bbValue == null || bbCodeInstance.isValidValue(bbValue)) {
					const bbTag = new BBTag(bbCodeInstance, bbValue, ignore, isClosingTag, reader.cursor - 1, tagReader.cursor + 1);
					if(bbTags.length == 0 || bbTags[bbTags.length - 1].bbCode != bbCodes.code.bbCode || bbTags[bbTags.length - 1].isClosingTag || bbCode == bbCodes.code.bbCode) {
						bbTags.push(bbTag);
					}
					reader.cursor = tagReader.cursor + 1;
				}
			}
		}
		return bbTags;
	}
	
	function createBBSections(bbTags) {
		var bbSections = new Map();
		var id = 0;
		while(bbTags.length > 0) {
			const startTag = bbTags.shift();
			if(startTag.isClosingTag) {
				continue;
			}
			//find closing bbcode tag
			var depth = 0;
			for(var x = 0; x < bbTags.length; x++) {
				const endTag = bbTags[x];
				if(startTag.bbCode.code != endTag.bbCode.code) { //bbcodes do not match, continue
					continue;
				}
				if(endTag.isClosingTag) {
					if(depth == 0) { //closing bbcode tag found
						bbTags.splice(x, 1);
						const bbSection = new BBSection(id++, startTag.bbCode, startTag.bbValue, startTag.ignore, startTag.start, startTag.end, endTag.start, endTag.end);
						bbSections.set(bbSection.id, bbSection);
						break;
					} else { //closing bbcode tag found but incorrect depth
						depth--;
					}
				} else {
					depth++;
				}
			}
		}
		return bbSections;
	}
	
	function findMissingUrls(message, bbSections) {
		var urlSections = [];
		var urlRegex = /(\w+:\/\/\S+)/g;
		var id = Math.max(Array.from(bbSections.keys())) + 1;
		while((match = urlRegex.exec(message)) != null) {
			const url = evaluateUrl(match, bbSections);
			if(url != null) {
				urlSections.push(new BBSection(id++, bbCodes.url, null, false, url.index, url.index, url.index + url[0].length, url.index + url[0].length));
			}
		}
		for(const bbSection of urlSections) {
			bbSections.set(bbSection.id, bbSection);
		}
		return bbSections;
	}
	
	function evaluateUrl(match, bbSections) {
		for(const bbSection of bbSections.values()) {
			if(bbSection.bbCode == bbCodes.url) {
				if(bbSection.openingTagStart < match.index && bbSection.openingTagEnd > match.index && bbSection.openingTagEnd <= match.index + match[0].length) {
					//url is inside opening tag
					return null;
				} else if(match.index > bbSection.openingTagEnd && match.index + match[0].length < bbSection.closingTagStart) {
					//url is between tags
					return null;
				}
			} else if(bbSection.openingTagStart > match.index && bbSection.openingTagStart < match.index + match[0].length) {
				//opening tag is inside link, shorten the link
				match[0] = match[0].substring(0, bbSection.openingTagStart - match.index);
			} else if(bbSection.closingTagStart > match.index && bbSection.closingTagStart < match.index + match[0].length) {
				//closing tag is inside link, shorten the link
				match[0] = match[0].substring(0, bbSection.closingTagStart - match.index);
			}
		}
		return match;
	}
	
	function createSegmentEdges(messageContents, bbSectionsMap) {
		const emojis = messageContents.emojis;
		const segmentEdges = [];
		for(const bbSection of bbSectionsMap.values()) {
			if(!bbSection.ignore) {
				segmentEdges.push({
					bbCode: bbSection.bbCode,
					start: bbSection.openingTagStart,
					end: bbSection.openingTagEnd,
					sectionId: bbSection.id,
					isClosingTag: false
				});
				segmentEdges.push({
					bbCode: bbSection.bbCode,
					start: bbSection.closingTagStart,
					end: bbSection.closingTagEnd,
					sectionId: bbSection.id,
					isClosingTag: true
				});
			} else {
				segmentEdges.push({
					start: bbSection.openingTagStart - 1,
					end: bbSection.openingTagStart,
					noElementCreation: true
				});
			}
		}
		for(var x = 0; x < emojis.length; x++) {
			segmentEdges.push({
				start: emojis[x].index,
				end: emojis[x].index,
				index: x
			});
		}
		segmentEdges.sort((a, b) => {
			if(a.start == b.start) {
				if(a.end == b.end) {
					const aHasIndex = 'index' in a;
					const bHasIndex = 'index' in b;
					if(aHasIndex && !bHasIndex) {
						return 1;
					} else if(!aHasIndex && bHasIndex) {
						return -1;
					} else if(aHasIndex && bHasIndex) {
						return a.index - b.index;
					}
					return 0;
				}
				return a.end - b.end;
			}
			return a.start - b.start;
		});
		return segmentEdges;
	}
	
	function createHtmlElements(messageContents, bbSectionsMap, segmentEdges) {
		const message = messageContents.text;
		const emojis = messageContents.emojis;
		const htmlElements = [[]];
		const nestedBbCodes = [];
		const sectionIds = new Set();
		var cursor = 0;
		for(const segmentEdge of segmentEdges) {
			const text = message.substring(cursor, segmentEdge.start);
			cursor = segmentEdge.end;
			if(text.length > 0) {
				const bbSections = Array.from(sectionIds).map(sectionId => {
					return bbSectionsMap.get(sectionId);
				});
				htmlElements[htmlElements.length - 1].push(createHtmlElement(text, bbSections));
			}
			if('noElementCreation' in segmentEdge) {
				continue;
			} else if('index' in segmentEdge) {
				htmlElements[htmlElements.length - 1].push(emojis[segmentEdge.index].node);
			} else if(segmentEdge.isClosingTag) {
				if(segmentEdge.bbCode.isNesting) {
					htmlElements[htmlElements.length - 2].push(nestedBbCodes.pop().applyStyle(htmlElements.pop(), bbSectionsMap.get(segmentEdge.sectionId).value));
				} else {
					sectionIds.delete(segmentEdge.sectionId);
				}
			} else {
				if(segmentEdge.bbCode.isNesting) {
					htmlElements.push([]);
					nestedBbCodes.push(segmentEdge.bbCode);
				} else {
					sectionIds.add(segmentEdge.sectionId);
				}
			}
		}
		if(cursor < message.length) {
			htmlElements[htmlElements.length - 1].push(createHtmlElement(message.substring(cursor), []));
		}
		return htmlElements[0];
	}
	
	function createHtmlElement(text, bbSections) {
		var htmlElement = createText(text);
		for(const bbSection of bbSections) {
			htmlElement = bbSection.bbCode.applyStyle(htmlElement, bbSection.value);
		}
		return htmlElement;
	}
	
	async function createTwitterEmbed(url) {
		const match = url.match(/^(\S+?)\/photo\/\d+$/);
		if(match != null) {
			url = match[1];
		}
		const tweet = await fetch("https://publish.twitter.com/oembed?theme=" + twitterEmbedTheme +"&dnt=true&omit_script=true&url=" + encodeURIComponent(url));
		const json = await tweet.json();
		const container = document.createElement("div");
		container.innerHTML = json.html;
		container.firstChild.style.display = "none";
		container.classList.add("ts-chat-message-attachment-integration");
		container.style.marginTop = "-10px";
		container.style.marginBottom = "-10px";
		return new TwitterAttachment(container);
	}
	
	function onWindowResize() {
		const previewImg = document.querySelector("img.betterchat-image-preview-img");
		if(previewImg != null) {
			resizeImagePreview(previewImg, previewImg.naturalWidth, previewImg.naturalHeight);
		}
	}
	
	function resizeImagePreview(previewImg, naturalWidth, naturalHeight) {
		const maxPreviewWidth = document.body.clientWidth * imagePreviewWidthPct;
		const maxPreviewHeight = document.body.clientHeight * imagePreviewHeightPct;
		var width = naturalWidth;
		var height = naturalHeight;
		if(width > maxPreviewWidth) {
			height *= maxPreviewWidth / width;
			width = maxPreviewWidth;
		}
		if(height > maxPreviewHeight) {
			width *= maxPreviewHeight / height;
			height = maxPreviewHeight;
		}
		if(width < maxPreviewWidth && height < maxPreviewHeight) {
			if(maxPreviewWidth - width < maxPreviewHeight - height) {
				height *= maxPreviewWidth / width;
				width = maxPreviewWidth;
			} else {
				width *= maxPreviewHeight / height;
				height = maxPreviewHeight;
			}
		}
		previewImg.width = width;
		previewImg.height = height;
	}
	
	function showImagePreview(url, naturalWidth, naturalHeight) {
		const img = document.createElement("img");
		img.classList.add("betterchat-image-preview-image");
		img.src = url;
		img.onclick = event => {
			event.stopPropagation();
			event.preventDefault();
		};
		resizeImagePreview(img, naturalWidth, naturalHeight);
		const link = document.createElement("a");
		link.classList.add("betterchat-image-preview-link");
		link.innerText = "View original";
		link.style.cursor = "pointer";
		link.onclick = event => {
			window.open(url);
			event.stopPropagation();
			event.preventDefault();
		};
		const wrapper = document.createElement("div");
		wrapper.appendChild(img);
		wrapper.appendChild(link);
		const container = document.createElement("div");
		container.classList.add("betterchat-image-preview");
		container.appendChild(wrapper);
		container.onclick = event => {
			container.remove();
			window.removeEventListener("resize", onWindowResize);
			event.stopPropagation();
			event.preventDefault();
		};
		document.body.appendChild(container);
		window.addEventListener("resize", onWindowResize);
	}
	
	function createImageEmbed(url) {
		return new Promise((resolve, reject) => {
			const img = document.createElement("img");
			img.onload = () => {
				img.classList.add("display");
				img.style.cursor = "pointer";
				const backing = document.createElement("img");
				backing.src = url;
				backing.classList.add("backing");
				const container = document.createElement("div");
				container.classList.add("ts-chat-message-attachment-image");
				container.appendChild(backing);
				container.appendChild(img);
				const integration = document.createElement("div");
				integration.classList.add("ts-chat-message-attachment-integration");
				integration.appendChild(container);
				resolve(new ImageAttachment(integration, url, img.naturalWidth, img.naturalHeight));
			}
			img.onerror = () => reject();
			img.src = url;
		});
	}
	
	function createMultimediaEmbed(url) {
		return new Promise((resolve, reject) => {
			const video = document.createElement("video");
			video.oncanplay = () => resolve(new MultimediaAttachment(video));
			video.onerror = () => reject();
			video.src = url;
		});
	}
	
	function createMediaEmbed(url) {
		return Promise.any([createImageEmbed(url), createMultimediaEmbed(url)]);
	}
	
	async function createAttachments(linkNodes) {
		const promises = new Map();
		for(const link of linkNodes) {
			if(attachmentCache.has(link.href)) {
				promises.set(link.href, attachmentCache.get(link.href));
				continue;
			} else if(promises.has(link.href)) {
				continue;
			}
			try {
				const url = new URL(link.href);
				if(url.protocol != "https:" && url.protocol != "http:" || url.hostname == "youtube.com" || url.hostname == "youtu.be" || url.hostname == "giphy.com") {
					continue;
				} else if(url.hostname == "twitter.com" && url.pathname != "/home" && url.pathname != "/explore" && url.pathname != "/notifications" && url.pathname != "/messages" && !url.pathname.startsWith("/i/")) {
					promises.set(link.href, createTwitterEmbed(url.href));
				} else {
					promises.set(link.href, createMediaEmbed(url.href));
				}
			} catch(e) {
				continue;
			}
		}
		await Promise.allSettled(promises.values());
		const fulfilled = [];
		for(const [link, promise] of promises.entries()) {
			if(!attachmentCache.has(link)) {
				attachmentCache.set(link, promise);
			}
			await promise.then(attachment => fulfilled.push(attachment.newInstance()), () => {});
		}
		return fulfilled;
	}
	
	function parseBBCodes(messageContents) {
		const bbTags = locateBBTags(messageContents.text);
		const bbSectionsMap = findMissingUrls(messageContents.text, createBBSections(bbTags));
		const segmentEdges = createSegmentEdges(messageContents, bbSectionsMap);
		const htmlElements = createHtmlElements(messageContents, bbSectionsMap, segmentEdges);
		return htmlElements;
	}
	
	function modifyMessageNode(node) {
		for(const childNode of node.childNodes) {
			if(childNode.tagName == "SAPN" && childNode.classList.contains("ts-parsed-text-content-emoji")) {
				return;
			}
		}
		if(settings.getValueForKey("chatStyling")) {
			const messageContents = gatherMessageContents(node);
			const htmlElements = parseBBCodes(messageContents);
			while(node.firstChild) {
				node.removeChild(node.lastChild);
			}
			for(const htmlElement of htmlElements) {
				node.appendChild(htmlElement);
			}
		}
		if(settings.getValueForKey("embeds")) {
			createAttachments(node.parentElement.querySelectorAll("a")).then(attachments => {
				if(attachments.length > 0) {
					var container = node.closest("div.ts-rendered-message").querySelector("div.ts-chat-message-attachment-container");
					var list = container.querySelector("div.ts-chat-message-attachments");
					if(list == null) {
						list = document.createElement("div");
						list.classList.add("ts-chat-message-attachments");
						container.appendChild(list);
					}
					for(const attachment of attachments) {
						const inner = document.createElement("div");
						inner.classList.add("ts-chat-message-attachment-inner");
						inner.appendChild(attachment);
						const outer = document.createElement("div");
						outer.classList.add("ts-chat-message-attachment");
						outer.appendChild(inner);
						list.appendChild(outer);
					}
				}
			});
		}
		node.dataset.parsed = true;
	}
	
	function isModifiedMessageNode(node) {
		return node.dataset.parsed;
	}
	
	function createSettingsCategoryHeader(name) {
		const title = document.createElement("div");
		title.classList.add("title");
		title.innerText = name;
		const header = document.createElement("div");
		header.classList.add("ts-widget-section-header");
		header.appendChild(title);
		return header;
	}
	
	function createSettingsContentWrapper() {
		const content = document.createElement("div");
		content.classList.add("ts-card", "ts-widget", "full");
		return content;
	}
	
	function createToggleSetting(title, description, configKey) {
		const input = document.createElement("input");
		input.type = "checkbox";
		const toggleInner = document.createElement("div");
		const updateToggleInner = enabled => {
			if(enabled) {
				toggleInner.classList.add("checked");
			} else if(toggleInner.classList.contains("checked")) {
				toggleInner.classList.remove("checked");
			}
		};
		updateToggleInner(settings.getValueForKey(configKey));
		toggleInner.classList.add("ts-toggle-inner", "visible");
		toggleInner.appendChild(input);
		const toggle = document.createElement("div");
		toggle.classList.add("ts-toggle");
		toggle.appendChild(toggleInner);
		const titleLabel = document.createElement("label");
		titleLabel.innerText = title;
		const toggleWrapper = document.createElement("div");
		toggleWrapper.classList.add("ts-toggle-wrapper", "ts-flex", "row");
		toggleWrapper.onclick = () => {
			const enabled = !settings.getValueForKey(configKey);
			settings.setValueForKey(configKey, enabled);
			updateToggleInner(enabled);
		};
		toggleWrapper.appendChild(titleLabel);
		toggleWrapper.appendChild(toggle);
		const subtitle = document.createElement("p");
		subtitle.classList.add("ts-card-subtitle");
		subtitle.innerText = description;
		const container = document.createElement("div");
		container.classList.add("ts-card-setting-container");
		container.appendChild(toggleWrapper);
		container.appendChild(subtitle);
		return container;
	}
	
	function appendSettingsToView() {
		const root = document.querySelector("div.ts-appearance-settings div.ts-widget-container");
		if(root == null) {
			return;
		}
		const header = createSettingsCategoryHeader("BetterChat");
		root.appendChild(header);
		const content = createSettingsContentWrapper();
		content.appendChild(createToggleSetting("Enable BetterChat", "Enables advanced chat features", "enabled"));
		content.appendChild(createToggleSetting("Rich Embeds", "Load rich embeds for links in chat messages", "embeds"));
		content.appendChild(createToggleSetting("BBCode support", "Support BBCode styling for chat messages", "chatStyling"));
		root.appendChild(content);
	}
	
	const chatMessageObserver = {
		observer: new MutationObserver((mutations, self) => {
			for(const mutation of mutations) {
				if(mutation.type == "childList" && settings.getValueForKey("enabled")) {
					for(const node of mutation.addedNodes) {
						try {
							if(mutation.target.localName == "span" && mutation.target.classList.contains("ts-chat-message-content") && mutation.target.classList.contains("ts-parsed-text-content") && !isModifiedMessageNode(mutation.target)) {
								modifyMessageNode(mutation.target);
							} else if(node.querySelector) {
								const message = node.querySelector(".ts-chat-message-content.ts-parsed-text-content")
								if(message != null && !isModifiedMessageNode(message)) {
									modifyMessageNode(message);
								}
							}
						} catch(e) {
							continue;
						}
					}
				}
			}
		}),
		observe(node) {
			this.observer.observe(node, {
				childList: true,
				attributes: false,
				characterData: false,
				subtree: true
			});
		},
		disconnect() {
			this.observer.disconnect();
		}
	};
	const documentObserver = {
		observer: new MutationObserver((mutations, self) => {
			for(const mutation of mutations) {
				if(mutation.type == "childList") {
					for(const node of mutation.removedNodes) {
						if(node.nodeType == Node.ELEMENT_NODE && node.tagName == "DIV") {
							if((node.classList.contains("ts-chat-container") || node.classList.contains("tsv-activity-detail")) && document.querySelectorAll("div.ts-chat-container").length == 0) {
								chatMessageObserver.disconnect();
								tooltipManager.destroyAll();
							}
						}
					}
					for(const node of mutation.addedNodes) {
						if(node.nodeType == Node.ELEMENT_NODE && node.tagName == "DIV") {
							if(node.classList.contains("tsv-activity-detail")) {
								const chat = node.querySelector("div.ts-chat-container");
								if(chat != null) {
									tooltipManager.destroyAll();
									chatMessageObserver.observe(node);
								}
							} else if(node.classList.contains("ts-chat-container")) {
								tooltipManager.destroyAll();
								chatMessageObserver.observe(node);
							} else if(node.classList.contains("ts-appearance-settings")) {
								const header = document.querySelector("div.tsv-bar.tsv-header-bar-below-tools div.tsv-item-text");
								if(header != null && header.innerText == "Behavior") {
									appendSettingsToView();
								}
							}
						}
					}
				}
			}
		}),
		observe(node) {
			this.observer.observe(node, {
				childList: true,
				attributes: false,
				characterData: false,
				subtree: true
			});
		}
	};
	settings.populateSettings(() => {
		tippy.setDefaultProps(tippyDefaultProps);
		documentObserver.observe(document.body);
	});
})();
