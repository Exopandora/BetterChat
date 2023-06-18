const messageParser = (function() {
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
		
		canRead(offset = 1) {
			return this.cursor + offset <= this.string.length;
		}
		
		peek(offset = 0) {
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
	
	function gatherMessageContents(node) {
		var message = "";
		var emojis = [];
		for(const childNode of node.childNodes) {
			if(childNode.tagName == "A") {
				message += childNode.textContent;
			} else if(childNode.tagName == "STRONG") {
				message += "[b]" + childNode.textContent + "[/b]";
			} else if(childNode.tagName == "DEL") {
				message += "[s]" + childNode.textContent + "[/s]";
			} else if(childNode.tagName == "EM") {
				message += "[i]" + childNode.textContent + "[/i]";
			} else if(childNode.tagName == "P" && childNode.classList.contains("spoiler")) {
				const [childMessage, childEmojis] = gatherMessageContents(childNode);
				for(const emoji of childEmojis) {
					emojis.push({
						index: message.length + emoji.index,
						node: emoji.node
					});
				}
				message += "[spoiler]" + childMessage + "[/spoiler]";
			} else if(childNode.tagName == "PRE") {
				message += "[code]" + childNode.textContent + "[/code]";
			} else if(childNode.tagName == "IMG" && childNode.dataset.type == "emoji") {
				emojis.push({
					index: message.length,
					node: childNode
				});
			} else {
				message += childNode.textContent;
			}
		}
		return [message, emojis];
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
					if(bbTags.length == 0 || bbTags[bbTags.length - 1].bbCode != bbCodes.code || bbTags[bbTags.length - 1].isClosingTag || bbCode == bbCodes.code.code) {
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
			} else if(bbSection.bbCode == bbCodes.code) {
				if(match.index > bbSection.openingTagEnd && match.index + match[0].length <= bbSection.closingTagEnd) {
					//url is between tags
					return null;
				}
			}
			if(bbSection.openingTagStart > match.index && bbSection.openingTagStart < match.index + match[0].length) {
				//opening tag is inside link, shorten the link
				match[0] = match[0].substring(0, bbSection.openingTagStart - match.index);
			} else if(bbSection.closingTagStart > match.index && bbSection.closingTagStart < match.index + match[0].length) {
				//closing tag is inside link, shorten the link
				match[0] = match[0].substring(0, bbSection.closingTagStart - match.index);
			}
		}
		return match;
	}
	
	function parseMessage(node) {
		const [message, emojis] = gatherMessageContents(node);
		const bbTags = locateBBTags(message);
		const bbSectionsMap = findMissingUrls(message, createBBSections(bbTags));
		return [message, emojis, bbSectionsMap];
	}
	
	return {
		parseMessage
	};
})();