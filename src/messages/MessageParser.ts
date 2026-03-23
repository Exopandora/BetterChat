import {BBCode, bbCodeMap, bbCodes} from "../bbcodes/BBCodes";

class BBTag {
    bbCode: BBCode;
    bbValue: string | null;
    ignore: boolean;
    isClosingTag: boolean;
    start: number;
    end: number;

    constructor(
        bbCode: BBCode,
        bbValue: string | null,
        ignore: boolean,
        isClosingTag: boolean,
        start: number,
        end: number,
    ) {
        this.bbCode = bbCode;
        this.bbValue = bbValue;
        this.ignore = ignore;
        this.isClosingTag = isClosingTag;
        this.start = start;
        this.end = end;
    }
}

export class BBSection {
    bbCode: BBCode;
    value: string | null;
    ignore: boolean;
    openingTagStart: number;
    openingTagEnd: number;
    closingTagStart: number;
    closingTagEnd: number
    convertToMarkdown: boolean;

    constructor(
        bbCode: BBCode,
        value: string | null,
        ignore: boolean,
        openingTagStart: number,
        openingTagEnd: number,
        closingTagStart: number,
        closingTagEnd: number,
        convertToMarkdown: boolean = false,
    ) {
        this.bbCode = bbCode;
        this.value = value;
        this.ignore = ignore;
        this.openingTagStart = openingTagStart;
        this.openingTagEnd = openingTagEnd;
        this.closingTagStart = closingTagStart;
        this.closingTagEnd = closingTagEnd;
        this.convertToMarkdown = convertToMarkdown;
    }

    intersectsWith(other: BBSection): boolean {
        return this.openingTagStart <= other.openingTagStart && this.closingTagEnd >= other.openingTagEnd // this contains opening tag of other
            || this.openingTagStart <= other.closingTagStart && this.closingTagEnd >= other.closingTagEnd;  // this contains closing tag of other
    }
}

class StringReader {
    string: string;
    cursor: number;

    constructor(string: string, cursor = 0) {
        this.string = string;
        this.cursor = cursor;
    }

    canRead(offset = 0): boolean {
        return this.cursor + offset < this.string.length;
    }

    peek(offset = 0): string {
        return this.string.charAt(this.cursor + offset);
    }

    read(): string {
        return this.string.charAt(this.cursor++);
    }

    skip() {
        this.cursor++;
    }

    copy(): StringReader {
        return new StringReader(this.string, this.cursor);
    }
}

function createBBSection(
    message: string,
    messagePart: string,
    bbCode: BBCode,
): BBSection {
    return new BBSection(
        bbCode,
        null,
        false,
        message.length,
        message.length,
        message.length + messagePart.length,
        message.length + messagePart.length,
    );
}

export type Emoji = {
    messageOffset: number;
    node: HTMLElement;
    substitute: boolean;
}

type MessageContents = {
    message: string;
    emojis: Emoji[];
    bbSections: BBSection[];
}

function gatherMessageContents(node: HTMLElement): MessageContents {
    let message = "";
    const emojis: Emoji[] = [];
    const bbSections: BBSection[] = [];
    for(const child of node.childNodes) {
        const childNode = <HTMLElement> child;
        if(childNode.tagName == "A") {
            message += childNode.textContent;
        } else if(childNode.tagName == "STRONG") {
            bbSections.push(createBBSection(message, childNode.textContent, bbCodes.bold));
            message += childNode.textContent;
        } else if(childNode.tagName == "DEL") {
            bbSections.push(createBBSection(message, childNode.textContent, bbCodes.strike));
            message += childNode.textContent;
        } else if(childNode.tagName == "EM") {
            bbSections.push(createBBSection(message, childNode.textContent, bbCodes.italic));
            message += childNode.textContent;
        } else if(childNode.tagName == "P" && childNode.classList.contains("spoiler")) {
            const childContents = gatherMessageContents(childNode);
            const childMessage = childContents.message;
            const childEmojis = childContents.emojis;
            const childBbSections = childContents.bbSections;
            for(const emoji of childEmojis) {
                emojis.push({
                    messageOffset: message.length + emoji.messageOffset,
                    node: emoji.node,
                    substitute: false,
                });
            }
            for(const bbSection of childBbSections) {
                // TODO: refactor id remapping
                bbSections.push(new BBSection(
                    bbSection.bbCode,
                    bbSection.value,
                    bbSection.ignore,
                    bbSection.openingTagStart + message.length,
                    bbSection.openingTagEnd + message.length,
                    bbSection.closingTagStart + message.length,
                    bbSection.closingTagEnd + message.length,
                    bbSection.convertToMarkdown,
                ));
            }
            bbSections.push(createBBSection(message, childMessage, bbCodes.spoiler));
            message += childMessage;
        } else if(childNode.tagName == "PRE") {
            bbSections.push(createBBSection(message, childNode.textContent, bbCodes.code));
            message += childNode.textContent;
        } else if(childNode.tagName == "CODE") {
            bbSections.push(createBBSection(message, childNode.textContent, bbCodes.pre));
            message += childNode.textContent;
        } else if(childNode.tagName == "svg" && childNode.dataset.type == "emoji") {
            emojis.push({
                messageOffset: message.length,
                node: childNode,
                substitute: false,
            });
        } else {
            message += childNode.textContent;
        }
    }
    return { message, emojis, bbSections };
}

function isAllowedBBCodeChar(char: string): boolean {
    return char != '[' && char != ']' && char != '=';
}

function isAllowedBBCodeValueChar(char: string): boolean {
    return char != '[' && char != ']';
}

function locateBBTags(message: string): BBTag[] {
    const bbTags: BBTag[] = [];
    if(message.length < 8) {
        return bbTags;
    }
    const reader = new StringReader(message);
    while(reader.canRead()) {
        if(reader.read() != '[') {
            continue;
        }
        // try parse bbcode tag
        const ignore = reader.cursor > 1 && reader.peek(-2) == '\\';
        const tagReader = reader.copy();
        const isClosingTag = tagReader.canRead() && tagReader.peek() == '/';
        if(isClosingTag) {
            tagReader.skip();
        }
        while(tagReader.canRead() && isAllowedBBCodeChar(tagReader.peek())) {
            tagReader.skip();
        }
        let bbCode: string | null = null;
        let bbValue: string | null  = null;
        if(!isClosingTag && tagReader.canRead() && tagReader.peek() == '=') { // parse value
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
        } else if(tagReader.canRead() && tagReader.peek() == ']') { // bbcode tag found
            bbCode = message.substring(reader.cursor + (isClosingTag ? 1 : 0), tagReader.cursor).toLowerCase();
        }
        if(bbCode != null && bbCodeMap.has(bbCode)) { // validate parsed result
            const bbCodeInstance = bbCodeMap.get(bbCode);
            if(isClosingTag && bbValue == null || bbCodeInstance.isValidValue(bbValue)) {
                bbTags.push(new BBTag(bbCodeInstance, bbValue, ignore, isClosingTag, reader.cursor - 1, tagReader.cursor + 1));
                reader.cursor = tagReader.cursor + 1;
            }
        }
    }
    return bbTags;
}

function isTagInSuppressedSection(bbTag: BBTag, bbSections: BBSection[]): boolean {
    return bbSections.some(section => section.bbCode.suppressNested && bbTag.start >= section.openingTagStart && bbTag.end <= section.closingTagEnd);
}

function createBBSections(bbTags: BBTag[], initial: BBSection[], emojis: Emoji[]): BBSection[] {
    const bbSections = initial.slice(0);
    const queue = bbTags.slice(0);
    while(queue.length > 0) {
        const startTag = queue.shift()!!;
        if(startTag.isClosingTag || isTagInSuppressedSection(startTag, bbSections)) {
            continue;
        }
        // find closing bbcode tag
        let depth = 0;
        for(let x = 0; x < queue.length; x++) {
            const endTag = queue[x];
            if(startTag.bbCode.code != endTag.bbCode.code || isTagInSuppressedSection(endTag, bbSections)) { // bbcodes do not match, continue
                continue;
            }
            if(endTag.isClosingTag) {
                if(depth == 0) { // closing bbcode tag found
                    const bbSection = new BBSection(startTag.bbCode, startTag.bbValue, startTag.ignore, startTag.start, startTag.end, endTag.start, endTag.end);
                    if(startTag.bbCode.suppressNested) {
                        for(const section of initial) {
                            if(bbSection.intersectsWith(section)) {
                                section.convertToMarkdown = true;
                            }
                        }
                        for(const emoji of emojis) {
                            if(emoji.messageOffset >= bbSection.openingTagEnd && emoji.messageOffset <= bbSection.closingTagStart) {
                                emoji.substitute = true;
                            }
                        }
                    }
                    queue.splice(x, 1);
                    bbSections.push(bbSection);
                    break;
                } else { // closing bbcode tag found but incorrect depth
                    depth--;
                }
            } else {
                depth++;
            }
        }
    }
    return bbSections;
}

function locatePlainUrls(message: string, bbSections: BBSection[]): BBSection[] {
    const urlSections = [];
    const urlRegex = /(\w+:\/\/\S+)/g;
    let match;
    while((match = urlRegex.exec(message)) != null) {
        const url = evaluateUrl(match, bbSections);
        if(url != null && url.index != null) {
            urlSections.push(new BBSection(bbCodes.url, null, false, url.index, url.index, url.index + url[0].length, url.index + url[0].length));
        }
    }
    return urlSections;
}

function evaluateUrl(match: RegExpMatchArray, bbSections: BBSection[]): RegExpMatchArray | null {
    if(match.index == null) {
        return null
    }
    for(const bbSection of bbSections) {
        if(bbSection.bbCode == bbCodes.url) {
            if(bbSection.openingTagStart < match.index && bbSection.openingTagEnd > match.index && bbSection.openingTagEnd <= match.index + match[0].length) {
                // url is inside opening tag
                return null;
            } else if(match.index > bbSection.openingTagEnd && match.index + match[0].length < bbSection.closingTagStart) {
                // url is between tags
                return null;
            }
        } else if(bbSection.bbCode.suppressNested) {
            if(match.index >= bbSection.openingTagEnd && match.index + match[0].length <= bbSection.closingTagEnd) {
                // url is between tags
                return null;
            }
        }
        if(bbSection.openingTagStart > match.index && bbSection.openingTagStart < match.index + match[0].length) {
            // opening tag is inside link, shorten the link
            match[0] = match[0].substring(0, bbSection.openingTagStart - match.index);
        } else if(bbSection.closingTagStart > match.index && bbSection.closingTagStart < match.index + match[0].length) {
            // closing tag is inside link, shorten the link
            match[0] = match[0].substring(0, bbSection.closingTagStart - match.index);
        }
    }
    return match;
}

type ParsedMessage = {
    message: string;
    emojis: Emoji[];
    bbSections: BBSection[];
}

export function parseMessage(node: HTMLElement): ParsedMessage {
    const contents = gatherMessageContents(node);
    const bbTags = locateBBTags(contents.message);
    const bbSections = createBBSections(bbTags, contents.bbSections, contents.emojis);
    const urlSections = locatePlainUrls(contents.message, bbSections);
    return {
        message: contents.message,
        emojis: contents.emojis,
        bbSections: bbSections.concat(urlSections),
    };
}
