const messageGenerator = (function() {
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
		const invalid = href.match(/^(?:https?|ts3file|ts3server|teamspeak):\/\/\S+$/) == null;
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
	
	function applyBoldFormatting(element) {
		const strong = document.createElement("strong");
		strong.appendChild(element);
		return strong;
	}
	
	function applyUnderlineFormatting(element) {
		const span = document.createElement("span");
		span.style.textDecoration = "underline";
		span.appendChild(element);
		return span;
	}
	
	function applyItalicFormatting(element) {
		const em = document.createElement("em");
		em.appendChild(element);
		return em;
	}
	
	function applyStrikeFormatting(element) {
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
	
	function applySpoilerFormatting(elements) {
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
		pre.appendChild(code);
		document.body.querySelector("#app").__vue__.$options.directives.highlightjs.bind(code, {
			value: {
				code: element.textContent,
				lang: undefined,
				onlyUpdate: false,
				withLangHtml: false
			}
		});
		return pre;
	}
	
	function applyInlineCodeFormatting(element) {
		const code = document.createElement("code");
		code.classList.add("inline-code");
		code.appendChild(element);
		return code;
	}
	
	function markdownCodeForBbCode(bbCode) {
		switch(bbCode) {
			case bbCodes.bold:
				return "**";
			case bbCodes.italic:
				return "__";
			case bbCodes.strike:
				return "~~";
			case bbCodes.spoiler:
				return "||";
			case bbCodes.code:
				return "```";
			case bbCodes.pre:
				return "`";
			default:
				return "";
		}
	}
	
	function createSegmentEdges(emojis, bbSectionsMap) {
		const segmentEdges = [];
		for(const bbSection of bbSectionsMap.values()) {
			if(!bbSection.ignore) {
				if(!bbSection.substitute) {
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
					const substitution = markdownCodeForBbCode(bbSection.bbCode);
					segmentEdges.push({
						start: bbSection.openingTagStart,
						end: bbSection.openingTagEnd,
						substitution: substitution,
						noElementCreation: true
					});
					segmentEdges.push({
						start: bbSection.closingTagStart,
						end: bbSection.closingTagEnd,
						substitution: substitution,
						noElementCreation: true
					});
				}
			} else {
				segmentEdges.push({
					start: bbSection.openingTagStart - 1,
					end: bbSection.openingTagStart,
					noElementCreation: true
				});
			}
		}
		for(var x = 0; x < emojis.length; x++) {
			const emoji = emojis[x];
			if(!emoji.substitute) {
				segmentEdges.push({
					start: emoji.index,
					end: emoji.index,
					index: x,
					noElementCreation: true
				});
			} else {
				segmentEdges.push({
					start: emoji.index,
					end: emoji.index,
					noElementCreation: true,
					substitution: ":" + emoji.node.__vue__.tsEmoji.shortcodes[0] + ":"
				});
			}
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
	
	function createHtmlElements(message, emojis, bbSectionsMap, segmentEdges) {
		const htmlElements = [[]];
		const nestedBbCodes = [];
		const sectionIds = new Set();
		var textElements = [];
		var cursor = 0;
		for(const segmentEdge of segmentEdges) {
			const text = message.substring(cursor, segmentEdge.start);
			cursor = segmentEdge.end;
			if(text.length > 0) {
				textElements.push(createText(text));
			}
			if('index' in segmentEdge) {
				textElements.push(emojis[segmentEdge.index].node);
			}
			if('substitution' in segmentEdge) {
				textElements.push(createText(segmentEdge.substitution));
			}
			if('noElementCreation' in segmentEdge) {
				continue;
			}
			if(textElements.length > 0) {
				const bbSections = Array.from(sectionIds).map(sectionId => bbSectionsMap.get(sectionId));
				htmlElements[htmlElements.length - 1].push(createHtmlElement(textElements, bbSections));
				textElements = [];
			}
			if(segmentEdge.isClosingTag) {
				if(hasNestedGeneration(segmentEdge.bbCode)) {
					const htmlElement = applyStyle(nestedBbCodes.pop(), htmlElements.pop(), bbSectionsMap.get(segmentEdge.sectionId).value);
					htmlElements[htmlElements.length - 1].push(htmlElement);
				} else {
					sectionIds.delete(segmentEdge.sectionId);
				}
			} else {
				if(hasNestedGeneration(segmentEdge.bbCode)) {
					htmlElements.push([]);
					nestedBbCodes.push(segmentEdge.bbCode);
				} else {
					sectionIds.add(segmentEdge.sectionId);
				}
			}
		}
		if(cursor < message.length) {
			textElements.push(createText(message.substring(cursor)));
		}
		if(textElements.length > 0) {
			htmlElements[htmlElements.length - 1].push(createHtmlElement(textElements, []));
		}
		return htmlElements[0];
	}
	
	function hasNestedGeneration(bbCode) {
		return bbCode.code == bbCodes.url.code || bbCode.code == bbCodes.spoiler.code;
	}
	
	function applyStyle(bbCode, element, value) {
		switch(bbCode) {
			case bbCodes.url:
				return applyUrlFormatting(element, value);
			case bbCodes.bold:
				return applyBoldFormatting(element);
			case bbCodes.underline:
				return applyUnderlineFormatting(element);
			case bbCodes.italic:
				return applyItalicFormatting(element);
			case bbCodes.strike:
				return applyStrikeFormatting(element);
			case bbCodes.color:
				return applyColorFormatting(element, value);
			case bbCodes.spoiler:
				return applySpoilerFormatting(element);
			case bbCodes.code:
				return applyCodeFormatting(element);
			case bbCodes.pre:
				return applyInlineCodeFormatting(element);
		}
	}
	
	function createText(text) {
		const span = document.createElement("span");
		span.textContent = text;
		return span;
	}
	
	function createHtmlElement(elements, bbSections) {
		var htmlElement;
		if(elements.length == 1) {
			htmlElement = elements[0];
		} else {
			htmlElement = document.createElement("span");
			for(const element of elements) {
				htmlElement.appendChild(element);
			}
		}
		for(const bbSection of bbSections) {
			htmlElement = applyStyle(bbSection.bbCode, htmlElement, bbSection.value);
		}
		return htmlElement;
	}
	
	function setClipboardString(text) {
		const element = document.createElement("textarea");
		element.value = text;
		document.body.appendChild(element);
		element.select();
		document.execCommand("copy");
		document.body.removeChild(element);
	}
	
	function generateHtml(message, emojis, bbSectionsMap) {
		const segmentEdges = createSegmentEdges(emojis, bbSectionsMap);
		const htmlElements = createHtmlElements(message, emojis, bbSectionsMap, segmentEdges);
		return htmlElements;
	}
	
	return {
		generateHtml
	};
})();