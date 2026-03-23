import {tippyDefaultProps, tooltipManager} from "../util/Tooltips";
import {BBCode, bbCodes} from "../bbcodes/BBCodes";
import {BBSection, Emoji} from "./MessageParser";

function applyUrlFormatting(elements: HTMLElement[], value: string | null): HTMLElement {
    const a = document.createElement("a");
    a.target = "_blank";
    a.rel = "noreferrer noopener";
    a.tabIndex = -1;
    a.dataset.originalTitle = "null";
    a.style.display = "inline-block";
    for(const element of elements) {
        a.appendChild(element);
    }
    let href = value || a.textContent;
    if(href.match(/^\w+:\/\/\S+$/) == null) {
        href = "https://" + href;
    }
    const invalid = href.match(/^((?:(?:https?|ts3file|ts3server|teamspeak):\/\/|www\.)[^\s<>\[\]]+[^<>.,:;"')\[\]\s])$/) == null;
    if(invalid) {
        a.classList.add("betterchat-invalid-link");
    }
    a.href = href;
    a.onclick = event => {
        if(invalid) {
            setClipboardString(a.href);
            let tippy = (<any> a)._tippy;
            if(tippy) {
                tippy.hide();
                tippy.setContent("Copied to clipboard!");
                tippy.setProps({
                    ...tippyDefaultProps,
                    onHidden(instance: any) {
                        instance.setContent("Links to: " + href);
                        instance.setProps(tippyDefaultProps);
                    }
                });
                tippy.show();
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

function applyBoldFormatting(element: HTMLElement): HTMLElement {
    const strong = document.createElement("strong");
    strong.appendChild(element);
    return strong;
}

function applyUnderlineFormatting(element: HTMLElement): HTMLElement {
    const span = document.createElement("span");
    span.style.textDecoration = "underline";
    span.appendChild(element);
    return span;
}

function applyItalicFormatting(element: HTMLElement): HTMLElement {
    const em = document.createElement("em");
    em.appendChild(element);
    return em;
}

function applyStrikeFormatting(element: HTMLElement): HTMLElement {
    const del = document.createElement("del");
    del.appendChild(element);
    return del;
}

function applyColorFormatting(element: HTMLElement, value: string | null): HTMLElement {
    const span = document.createElement("span");
    if(value) {
        span.style.color = value;
    }
    span.appendChild(element);
    return span;
}

function applySpoilerFormatting(elements: HTMLElement[]): HTMLElement {
    const p = document.createElement("p");
    p.classList.add("spoiler");
    p.classList.add("has-tooltip");
    p.ariaHidden = "true";
    p.dataset.originalTitle = "null";
    for(const element of elements) {
        p.appendChild(element);
    }
    const childTooltips = tooltipManager.createTooltip(p, "Click to reveal spoiler");
    p.onclick = event => {
        p.setAttribute("visible", "true");
        tooltipManager.destroyTooltip(p);
        for(const childTooltip of childTooltips) {
            if((<any> childTooltip)._tippy) {
                (<any> childTooltip)._tippy.enable();
            }
        }
        event.stopPropagation();
        event.preventDefault();
    };
    return p;
}

function applyCodeFormatting(element: HTMLElement): HTMLElement {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    pre.appendChild(code);
    (<any> document.body.querySelector("#app")).__vue__.$options.directives.highlightjs.bind(code, {
        value: {
            code: element.textContent,
            lang: undefined,
            onlyUpdate: false,
            withLangHtml: false
        }
    });
    return pre;
}

function applyInlineCodeFormatting(element: HTMLElement): HTMLElement {
    const code = document.createElement("code");
    code.classList.add("inline-code");
    code.appendChild(element);
    return code;
}

function markdownCodeForBbCode(bbCode: BBCode): string {
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

abstract class SegmentEdge {
    start: number;
    end: number;

    protected constructor(
        start: number,
        end: number,
    ) {
        this.start = start;
        this.end = end;
    }
}

class BBCodeEdge extends SegmentEdge {
    bbSection: BBSection;
    isClosingTag: boolean;

    constructor(
        start: number,
        end: number,
        bbSection: BBSection,
        isClosingTag: boolean
    ) {
        super(start, end);
        this.bbSection = bbSection;
        this.isClosingTag = isClosingTag;
    }
}

class PlaceholderEdge extends SegmentEdge {
    placeholder: HTMLElement | null;

    constructor(start: number, end: number, placeholder: HTMLElement | null = null) {
        super(start, end);
        this.placeholder = placeholder;
    }
}

function createSegmentEdges(emojis: Emoji[], bbSections: BBSection[]) {
    const segmentEdges: SegmentEdge[] = [];
    for(const bbSection of bbSections) {
        if(!bbSection.ignore) {
            if(!bbSection.convertToMarkdown) {
                segmentEdges.push(
                    new BBCodeEdge(
                        bbSection.openingTagStart,
                        bbSection.openingTagEnd,
                        bbSection,
                        false,
                    )
                );
                segmentEdges.push(
                    new BBCodeEdge(
                        bbSection.closingTagStart,
                        bbSection.closingTagEnd,
                        bbSection,
                        true,
                    )
                );
            } else {
                const markdown = markdownCodeForBbCode(bbSection.bbCode);
                segmentEdges.push(
                    new PlaceholderEdge(
                        bbSection.openingTagStart,
                        bbSection.openingTagEnd,
                        createText(markdown),
                    )
                );
                segmentEdges.push(
                    new PlaceholderEdge(
                        bbSection.closingTagStart,
                        bbSection.closingTagEnd,
                        createText(markdown),
                    )
                );
            }
        } else {
            segmentEdges.push(
                new PlaceholderEdge(
                    bbSection.openingTagStart - 1,
                    bbSection.openingTagStart,
                )
            );
        }
    }
    for(const emoji of emojis) {
        if(!emoji.substitute) {
            segmentEdges.push(
                new PlaceholderEdge(
                    emoji.messageOffset,
                    emoji.messageOffset,
                    emoji.node,
                )
            );
        } else {
            segmentEdges.push(
                new PlaceholderEdge(
                    emoji.messageOffset,
                    emoji.messageOffset,
                    createText(":" + (<any> emoji.node).__vue__.tsEmoji.shortcodes[0] + ":"),
                )
            );
        }
    }
    return segmentEdges.sort((a, b) => {
        if(a.start == b.start) {
            if(a.end == b.end) {
                return 0;
            }
            return a.end - b.end;
        }
        return a.start - b.start;
    });
}

function createHtmlElements(message: string, segmentEdges: SegmentEdge[]): HTMLElement[] {
    const htmlElements: HTMLElement[][] = [[]];
    const nestedBbCodes: BBCode[] = [];
    const bbSections = new Set<BBSection>();
    let textElements: HTMLElement[] = [];
    let cursor = 0;
    for(const segmentEdge of segmentEdges) {
        const text = message.substring(cursor, segmentEdge.start);
        cursor = segmentEdge.end;
        if(text.length > 0) {
            textElements.push(createText(text));
        }
        if(segmentEdge instanceof PlaceholderEdge && segmentEdge.placeholder != null) {
            textElements.push(segmentEdge.placeholder);
        }
        if(!(segmentEdge instanceof BBCodeEdge)) {
            continue;
        }
        if(textElements.length > 0) {
            htmlElements[htmlElements.length - 1].push(createHtmlElement(textElements, Array.from(bbSections)));
            textElements = [];
        }
        if(segmentEdge.isClosingTag) {
            if(hasNestedGeneration(segmentEdge.bbSection.bbCode)) {
                const htmlElement = applyStyle(nestedBbCodes.pop()!!, htmlElements.pop()!!, segmentEdge.bbSection.value);
                htmlElements[htmlElements.length - 1].push(htmlElement);
            } else {
                bbSections.delete(segmentEdge.bbSection);
            }
        } else {
            if(hasNestedGeneration(segmentEdge.bbSection.bbCode)) {
                htmlElements.push([]);
                nestedBbCodes.push(segmentEdge.bbSection.bbCode);
            } else {
                bbSections.add(segmentEdge.bbSection);
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

function hasNestedGeneration(bbCode: BBCode): boolean {
    return bbCode == bbCodes.url || bbCode == bbCodes.spoiler;
}

function applyStyle(bbCode: BBCode, element: HTMLElement | HTMLElement[], value: string | null): HTMLElement {
    switch(bbCode) {
        case bbCodes.url:
            return applyUrlFormatting(<HTMLElement[]> element, value);
        case bbCodes.bold:
            return applyBoldFormatting(<HTMLElement> element);
        case bbCodes.underline:
            return applyUnderlineFormatting(<HTMLElement> element);
        case bbCodes.italic:
            return applyItalicFormatting(<HTMLElement> element);
        case bbCodes.strike:
            return applyStrikeFormatting(<HTMLElement> element);
        case bbCodes.color:
            return applyColorFormatting(<HTMLElement> element, value);
        case bbCodes.spoiler:
            return applySpoilerFormatting(<HTMLElement[]> element);
        case bbCodes.code:
            return applyCodeFormatting(<HTMLElement> element);
        case bbCodes.pre:
            return applyInlineCodeFormatting(<HTMLElement> element);
        default:
            throw Error(`Unknown bbcode ${bbCode.code}`);
    }
}

function createText(text: string): HTMLElement {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
}

function createHtmlElement(elements: HTMLElement[], bbSections: BBSection[]): HTMLElement {
    let htmlElement;
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

function setClipboardString(text: string) {
    const element = document.createElement("textarea");
    element.value = text;
    document.body.appendChild(element);
    element.select();
    document.execCommand("copy");
    document.body.removeChild(element);
}

export function generateHtml(message: string, emojis: Emoji[], bbSections: BBSection[]): HTMLElement[] {
    const segmentEdges = createSegmentEdges(emojis, bbSections);
    return createHtmlElements(message, segmentEdges);
}
