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
		constructor(id, bbCode, value, ignore, openingTagStart, openingTagEnd, closingTagStart, closingTagEnd, substitute = false) {
			this.id = id;
			this.bbCode = bbCode;
			this.value = value;
			this.ignore = ignore;
			this.openingTagStart = openingTagStart;
			this.openingTagEnd = openingTagEnd;
			this.closingTagStart = closingTagStart;
			this.closingTagEnd = closingTagEnd;
			this.substitute = substitute;
		}
		
		intersectsWith(other) {
			return this.openingTagStart <= other.openingTagStart && this.closingTagEnd >= other.openingTagEnd //this contains opening tag of other
					|| this.openingTagStart <= other.closingTagStart && this.closingTagEnd >= other.closingTagEnd;  //this contains closing tag of other
		}
	}
	
	class StringReader {
		constructor(string, cursor = 0) {
			this.string = string;
			this.cursor = cursor;
		}
		
		canRead(offset = 0) {
			return this.cursor + offset < this.string.length;
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
	
	function createBBSection(id, message, messagePart, bbCode, substitution) {
		return new BBSection(
			id,
			bbCode,
			null,
			false,
			message.length,
			message.length,
			message.length + messagePart.length,
			message.length + messagePart.length,
			substitution
		);
	}
	
	function gatherMessageContents(node) {
		var message = "";
		const emojis = [];
		const bbSections = [];
		for(const childNode of node.childNodes) {
			if(childNode.tagName == "A") {
				message += childNode.textContent;
			} else if(childNode.tagName == "STRONG") {
				bbSections.push(createBBSection(bbSections.length, message, childNode.textContent, bbCodes.bold));
				message += childNode.textContent;
			} else if(childNode.tagName == "DEL") {
				bbSections.push(createBBSection(bbSections.length, message, childNode.textContent, bbCodes.strike));
				message += childNode.textContent;
			} else if(childNode.tagName == "EM") {
				bbSections.push(createBBSection(bbSections.length, message, childNode.textContent, bbCodes.italic));
				message += childNode.textContent;
			} else if(childNode.tagName == "P" && childNode.classList.contains("spoiler")) {
				const [childMessage, childEmonijs, childBbSections] = gatherMessageContents(childNode);
				for(const emoji of childEmonijs) {
					emojis.push({
						index: message.length + emoji.index,
						node: emoji.node
					});
				}
				for(const bbSection of childBbSections) {
					bbSections.push(new BBSection(
						bbSections.length,
						bbSection.bbCode,
						bbSection.value,
						bbSection.ignore,
						bbSection.openingTagStart + message.length,
						bbSection.openingTagEnd + message.length,
						bbSection.closingTagStart + message.length,
						bbSection.closingTagEnd + message.length,
						bbSection.substitution
					));
				}
				bbSections.push(createBBSection(bbSections.length, message, childMessage, bbCodes.spoiler));
				message += childMessage;
			} else if(childNode.tagName == "PRE") {
				bbSections.push(createBBSection(bbSections.length, message, childNode.textContent, bbCodes.code));
				message += childNode.textContent;
			} else if(childNode.tagName == "CODE") {
				bbSections.push(createBBSection(bbSections.length, message, childNode.textContent, bbCodes.pre));
				message += childNode.textContent;
			} else if(childNode.tagName == "svg" && childNode.dataset.type == "emoji") {
				emojis.push({
					index: message.length,
					node: childNode
				});
			} else {
				message += childNode.textContent;
			}
		}
		return [message, emojis, bbSections];
	}
	
	function isAllowedBBCodeChar(char) {
		return char != '[' && char != ']' && char != '=';
	}
	
	function isAllowedBBCodeValueChar(char) {
		return char != '[' && char != ']';
	}
	
	function locateBBTags(message) {
		var bbTags = [];
		if(message.length < 8) {
			return bbTags;
		}
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
					bbTags.push(new BBTag(bbCodeInstance, bbValue, ignore, isClosingTag, reader.cursor - 1, tagReader.cursor + 1));
					reader.cursor = tagReader.cursor + 1;
				}
			}
		}
		return bbTags;
	}
	
	function isTagInSuppressedSection(bbTag, bbSections) {
		return bbSections.some(section => section.bbCode.suppressNested && bbTag.start >= section.openingTagStart && bbTag.end <= section.closingTagEnd);
	}
	
	function createBBSections(bbTags, initial, emojis) {
		var bbSections = initial.slice(0);
		var queue = bbTags.slice(0);
		while(queue.length > 0) {
			const startTag = queue.shift();
			if(startTag.isClosingTag || isTagInSuppressedSection(startTag, bbSections)) {
				continue;
			}
			//find closing bbcode tag
			var depth = 0;
			for(var x = 0; x < queue.length; x++) {
				const endTag = queue[x];
				if(startTag.bbCode.code != endTag.bbCode.code || isTagInSuppressedSection(endTag, bbSections)) { //bbcodes do not match, continue
					continue;
				}
				if(endTag.isClosingTag) {
					if(depth == 0) { //closing bbcode tag found
						const bbSection = new BBSection(bbSections.length, startTag.bbCode, startTag.bbValue, startTag.ignore, startTag.start, startTag.end, endTag.start, endTag.end);
						if(startTag.bbCode.suppressNested) {
							for(const section of initial) {
								if(bbSection.intersectsWith(section)) {
									section.substitute = true;
								}
							}
							for(const emoji of emojis) {
								if(emoji.index >= bbSection.openingTagEnd && emoji.index <= bbSection.closingTagStart) {
									emoji.substitute = true;
								}
							}
						}
						queue.splice(x, 1);
						bbSections.push(bbSection);
						break;
					} else { //closing bbcode tag found but incorrect depth
						depth--;
					}
				} else {
					depth++;
				}
			}
		}
		return new Map(bbSections.map(x => [x.id, x]));
	}
	
	function locatePlainUrls(message, bbSections) {
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
			} else if(bbSection.bbCode.suppressNested) {
				if(match.index >= bbSection.openingTagEnd && match.index + match[0].length <= bbSection.closingTagEnd) {
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
		const [message, emojis, bbSections] = gatherMessageContents(node);
		const bbTags = locateBBTags(message);
		const bbSectionsMap = createBBSections(bbTags, bbSections, emojis);
		locatePlainUrls(message, bbSectionsMap);
		return [message, emojis, bbSectionsMap];
	}
	
	return {
		parseMessage
	};
})();