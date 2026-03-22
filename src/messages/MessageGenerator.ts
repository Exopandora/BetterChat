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

class SegmentEdge {
    bbCode: BBCode | null;
    start: number;
    end: number;
    sectionId: number | null;
    isClosingTag: boolean;
    noElementCreation: boolean;
    substitution: string | null;
    index: number | null;

    constructor(
        options: {
            bbCode?: BBCode,
            start: number,
            end: number,
            sectionId?: number,
            isClosingTag?: boolean ,
            noElementCreation?: boolean,
            substitution?: string,
            index?: number,
        }
    ) {
        this.bbCode = options.bbCode ?? null;
        this.start = options.start;
        this.end = options.end;
        this.sectionId = options.sectionId ?? null;
        this.isClosingTag = options.isClosingTag ?? false;
        this.noElementCreation = options.noElementCreation ?? false;
        this.substitution = options.substitution ?? null;
        this.index = options.index ?? null;
    }
}

function createSegmentEdges(emojis: Emoji[], bbSectionsMap: Map<number, BBSection>) {
    const segmentEdges: SegmentEdge[] = [];
    for(const bbSection of bbSectionsMap.values()) {
        if(!bbSection.ignore) {
            if(!bbSection.substitute) {
                segmentEdges.push(
                    new SegmentEdge({
                        bbCode: bbSection.bbCode,
                        start: bbSection.openingTagStart,
                        end: bbSection.openingTagEnd,
                        sectionId: bbSection.id,
                        isClosingTag: false
                    })
                );
                segmentEdges.push(
                    new SegmentEdge({
                        bbCode: bbSection.bbCode,
                        start: bbSection.closingTagStart,
                        end: bbSection.closingTagEnd,
                        sectionId: bbSection.id,
                        isClosingTag: true
                    })
                );
            } else {
                const substitution = markdownCodeForBbCode(bbSection.bbCode);
                segmentEdges.push(
                    new SegmentEdge({
                        start: bbSection.openingTagStart,
                        end: bbSection.openingTagEnd,
                        substitution: substitution,
                        noElementCreation: true
                    })
                );
                segmentEdges.push(
                    new SegmentEdge({
                        start: bbSection.closingTagStart,
                        end: bbSection.closingTagEnd,
                        substitution: substitution,
                        noElementCreation: true
                    })
                );
            }
        } else {
            segmentEdges.push(
                new SegmentEdge({
                    start: bbSection.openingTagStart - 1,
                    end: bbSection.openingTagStart,
                    noElementCreation: true
                })
            );
        }
    }
    for(let x = 0; x < emojis.length; x++) {
        const emoji = emojis[x];
        if(!emoji.substitute) {
            segmentEdges.push(
                new SegmentEdge({
                    start: emoji.index,
                    end: emoji.index,
                    index: x,
                    noElementCreation: true
                })
            );
        } else {
            segmentEdges.push(
                new SegmentEdge({
                    start: emoji.index,
                    end: emoji.index,
                    noElementCreation: true,
                    substitution: ":" + (<any> emoji.node).__vue__.tsEmoji.shortcodes[0] + ":"
                })
            );
        }
    }
    segmentEdges.sort((a, b) => {
        if(a.start == b.start) {
            if(a.end == b.end) {
                const aHasIndex = a.index != null;
                const bHasIndex = b.index != null;
                if(aHasIndex && !bHasIndex) {
                    return 1;
                } else if(!aHasIndex && bHasIndex) {
                    return -1;
                } else if(aHasIndex && bHasIndex) {
                    return a.index!! - b.index!!;
                }
                return 0;
            }
            return a.end - b.end;
        }
        return a.start - b.start;
    });
    return segmentEdges;
}

function createHtmlElements(message: string, emojis: Emoji[], bbSectionsMap: Map<number, BBSection>, segmentEdges: SegmentEdge[]) {
    const htmlElements: HTMLElement[][] = [[]];
    const nestedBbCodes: BBCode[] = [];
    const sectionIds = new Set<number>();
    let textElements: HTMLElement[] = [];
    let cursor = 0;
    for(const segmentEdge of segmentEdges) {
        const text = message.substring(cursor, segmentEdge.start);
        cursor = segmentEdge.end;
        if(text.length > 0) {
            textElements.push(createText(text));
        }
        if(segmentEdge.index != null) {
            textElements.push(emojis[segmentEdge.index].node);
        }
        if(segmentEdge.substitution != null) {
            textElements.push(createText(segmentEdge.substitution));
        }
        if(segmentEdge.noElementCreation) {
            continue;
        }
        if(textElements.length > 0) {
            const bbSections = Array.from(sectionIds).map(sectionId => bbSectionsMap.get(sectionId)!!);
            htmlElements[htmlElements.length - 1].push(createHtmlElement(textElements, bbSections));
            textElements = [];
        }
        if(segmentEdge.isClosingTag) {
            // TODO: refactor segment edges
            if(hasNestedGeneration(segmentEdge.bbCode!!)) {
                const htmlElement = applyStyle(nestedBbCodes.pop()!!, htmlElements.pop()!!, bbSectionsMap.get(segmentEdge.sectionId!!)!!.value);
                htmlElements[htmlElements.length - 1].push(htmlElement);
            } else {
                sectionIds.delete(segmentEdge.sectionId!!);
            }
        } else {
            if(hasNestedGeneration(segmentEdge.bbCode!!)) {
                htmlElements.push([]);
                nestedBbCodes.push(segmentEdge.bbCode!!);
            } else {
                sectionIds.add(segmentEdge.sectionId!!);
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
    return bbCode.code == bbCodes.url.code || bbCode.code == bbCodes.spoiler.code;
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

export function generateHtml(message: string, emojis: Emoji[], bbSectionsMap: Map<number, BBSection>) {
    const segmentEdges = createSegmentEdges(emojis, bbSectionsMap);
    return createHtmlElements(message, emojis, bbSectionsMap, segmentEdges);
}
