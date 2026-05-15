import katex from "katex";
import {ImageLoader} from "../../helpers/ImageLoader";
import {Tooltips} from "../../helpers/Tooltips";
import {getAppController, getVueInstance, translate} from "../../helpers/Util";
import {
    BlockquoteNode,
    BoldNode,
    CenterAlignNode,
    CodeNode,
    ColorNode,
    DetailsContentNode,
    DetailsNode,
    DetailsSummaryNode,
    EmojiNode,
    FootnoteNode,
    HeadingNode,
    HighlightNode,
    InlineCodeNode,
    InlineMathNode,
    ItalicNode,
    JustifyAlignNode,
    LeftAlignNode,
    ListItemNode,
    ListNode,
    MathNode,
    MermaidNode,
    Node,
    Nodes,
    RightAlignNode,
    SpoilerNode,
    StrikethroughNode,
    StringNode,
    SubscriptNode,
    SuperscriptNode,
    TableDataNode,
    TableHeaderNode,
    TableNode,
    TableRowNode,
    TaskListItemNode,
    ThematicBreakNode,
    UnderlineNode,
    UrlNode
} from "../node/Node";
import {AbstractVisitor} from "../node/Visitor";
import {AbstractRenderer, NodeRenderer, RenderContext, RenderTarget} from "./Renderer";

const HEADING_SIZE_TO_ELEMENT_TAG = new Map<number, string>([
    [1, "h1"],
    [2, "h2"],
    [3, "h3"],
    [4, "h4"],
    [5, "h5"],
    [6, "h6"],
]);

class MessageNodeRenderer extends AbstractVisitor implements NodeRenderer {
    private readonly context: RenderContext<MessageRenderTarget>;
    private parent: Element;
    private footnotes: HTMLLIElement[] = [];

    constructor(context: RenderContext<MessageRenderTarget>) {
        super();
        this.context = context;
        this.parent = this.root;
    }

    beforeRoot(_: Node): void {

    }

    render(node: Node): void {
        node.accept(this);
    }

    afterRoot(_: Node): void {
        if (this.footnotes.length > 0) {
            this.root.appendChild(document.createElement("hr"));
            const section = document.createElement("section");
            section.classList.add("md-footnotes");
            const ol = document.createElement("ol");
            section.appendChild(ol);
            for (const footnote of this.footnotes) {
                ol.appendChild(footnote);
            }
            this.root.appendChild(section);
        }
    }

    visitBoldNode(node: BoldNode): void {
        const strong = document.createElement("strong");
        this.append(node, strong);
    }

    visitInlineCodeNode(node: InlineCodeNode): void {
        const code = document.createElement("code");
        this.append(node, code);
    }

    visitCodeNode(node: CodeNode): void {
        const code = document.createElement("code");
        code.classList.add("cm-highlighted");
        const pre = document.createElement("pre");
        if (node.language != null) {
            pre.dataset.codeLang = node.language;
            pre.dataset.codeLangLabel = node.language;
        }
        pre.appendChild(code);
        this.append(node, pre, code);
        code.dataset.code = btoa(code.textContent);
        const app = getVueInstance(document.body.querySelector("#app"));
        if (app != null) {
            const config = {
                code: code.textContent.trimStart(),
                lang: node.language,
                onlyUpdate: false,
                withLangHtml: false,
            };
            app.$options.directives.highlightjs.bind(code, {value: config});
            window.requestIdleCallback(() => {
                const lines: globalThis.Node[] = [];
                const buffer: globalThis.Node[] = [];
                for (const child of code.childNodes) {
                    if (child instanceof Text) {
                        const split = child.textContent.split("\n");
                        for (let x = 0; x < split.length; x++) {
                            buffer.push(document.createTextNode(split[x]));
                            if (x < split.length - 1) {
                                const line = document.createElement("span");
                                line.classList.add("md-code-line");
                                line.append(...buffer);
                                lines.push(line);
                                buffer.splice(0, buffer.length);
                            }
                        }
                    } else if (child instanceof HTMLElement) {
                        const split = child.textContent.split("\n");
                        for (let x = 0; x < split.length; x++) {
                            const clone = child.cloneNode(false) as HTMLElement;
                            clone.textContent = split[x];
                            buffer.push(clone);
                            if (x < split.length - 1) {
                                const line = document.createElement("span");
                                line.classList.add("md-code-line");
                                line.append(...buffer);
                                lines.push(line);
                                buffer.splice(0, buffer.length);
                            }
                        }
                    }
                }
                if (buffer.length > 1) {
                    const line = document.createElement("span");
                    line.classList.add("md-code-line");
                    line.append(...buffer);
                    lines.push(line);
                    buffer.splice(0, buffer.length);
                }
                while (code.firstChild) {
                    code.removeChild(code.lastChild as globalThis.Node);
                }
                code.append(...lines);
                if (node.language == null) {
                    const lang = Array.from(code.classList)
                        .find((clazz) => clazz.startsWith("language-"))
                        ?.replace("language-", "");
                    if (lang != null) {
                        pre.dataset.codeLang = lang;
                        pre.dataset.codeLangLabel = lang + " (" + (translate("universal.automatic_shortform") ?? "auto") + ")";
                    }
                }
            });
        }
    }

    visitColorNode(node: ColorNode): void {
        const span = document.createElement("span");
        span.style.color = node.color;
        this.append(node, span);
    }

    visitEmojiNode(node: EmojiNode): void {
        this.append(node, node.node);
    }

    visitItalicNode(node: ItalicNode): void {
        const em = document.createElement("em");
        this.append(node, em);
    }

    visitSpoilerNode(node: SpoilerNode): void {
        const span = document.createElement("span");
        span.classList.add("md-spoiler");
        this.append(node, span);
        const childTooltips = Tooltips.disableNestedTooltips(span);
        span.addEventListener("click", (event: PointerEvent) => {
            span.setAttribute("visible", "");
            Tooltips.destroy(span);
            Tooltips.enableAll(childTooltips);
            event.stopPropagation();
            event.preventDefault();
        });
    }

    visitStrikethroughNode(node: StrikethroughNode): void {
        const del = document.createElement("del");
        this.append(node, del);
    }

    visitStringNode(node: StringNode): void {
        const span = document.createElement("span");
        span.textContent = node.string;
        this.parent.appendChild(span);
    }

    visitUnderlineNode(node: UnderlineNode): void {
        const u = document.createElement("u");
        this.append(node, u);
    }

    visitUrlNode(node: UrlNode): void {
        const a = document.createElement("a");
        a.target = "_blank";
        a.rel = "noreferrer noopener";
        a.tabIndex = -1;
        this.append(node, a);
        let href = node.url || a.textContent;
        if (href.match(/^\w+:\/\/\S+$/) == null) {
            href = "https://" + href;
        }
        const invalid = href.match(/^((?:(?:https?|ts3file|ts3server|teamspeak):\/\/|www\.)[^\s<>\[\]]+[^<>.,:;"')\[\]\s])$/) == null;
        if (invalid) {
            a.classList.add("betterchat-invalid-link");
        } else {
            a.classList.add("ts-parsed-link")
        }
        a.href = href;
        a.addEventListener("click", (event: PointerEvent) => {
            if (invalid) {
                getAppController().copyTextToClipboard(href);
                Tooltips.setTooltipContentUntilHidden(a, "Copied to clipboard!");
            } else {
                getAppController().openExternalLink(href);
            }
            event.stopPropagation();
            event.preventDefault();
        });
        Tooltips.create(a, translate("chat.message.link.links_to", {url: href}));
    }

    visitSuperscriptNode(node: SuperscriptNode) {
        const sup = document.createElement("sup");
        this.append(node, sup);
    }

    visitSubscriptNode(node: SubscriptNode) {
        const sub = document.createElement("sub");
        this.append(node, sub);
    }

    visitDetailsNode(node: DetailsNode) {
        const details = document.createElement("details");
        this.append(node, details);
    }

    visitDetailsSummaryNode(node: DetailsSummaryNode) {
        const summary = document.createElement("summary");
        this.append(node, summary);
    }

    visitDetailsContentNode(node: DetailsContentNode) {
        const div = document.createElement("div");
        div.classList.add("md-details-content");
        this.append(node, div);
    }

    visitThematicBreakNode(_: ThematicBreakNode) {
        const hr = document.createElement("hr");
        this.parent.appendChild(hr);
    }

    visitHeadingNode(node: HeadingNode): void {
        const heading = document.createElement(HEADING_SIZE_TO_ELEMENT_TAG.get(node.size) ?? "h1");
        this.append(node, heading);
    }

    visitCenterAlignNode(node: CenterAlignNode): void {
        // noinspection JSDeprecatedSymbols
        const center = document.createElement("center");
        center.classList.add("md-align-block")
        this.append(node, center);
    }

    visitRightAlignNode(node: RightAlignNode): void {
        const div = document.createElement("div");
        div.classList.add("md-align-block");
        div.style.textAlign = "right";
        this.append(node, div);
    }

    visitLeftAlignNode(node: LeftAlignNode): void {
        const div = document.createElement("div");
        div.classList.add("md-align-block");
        div.style.textAlign = "left";
        this.append(node, div);
    }

    visitJustifyAlignNode(node: JustifyAlignNode): void {
        const div = document.createElement("div");
        div.classList.add("md-align-block");
        div.style.textAlign = "justify";
        this.append(node, div);
    }

    visitHighlightNode(node: HighlightNode): void {
        const mark = document.createElement("mark");
        mark.classList.add("md-highlight");
        this.append(node, mark);
    }

    visitFootnoteNode(node: FootnoteNode): void {
        const sup = document.createElement("sup");
        sup.textContent = (this.footnotes.length + 1).toString();
        this.parent.appendChild(sup);
        const prevParent = this.parent;
        const footnote = document.createElement("li");
        this.footnotes.push(footnote);
        this.parent = footnote;
        this.visitChildren(node);
        this.parent = prevParent;
    }

    visitListNode(node: ListNode): void {
        let list;
        switch (node.type) {
            case ListNode.ListType.DECIMAL:
                list = document.createElement("ol");
                list.classList.add("betterchat-list-style-type-decimal");
                break;
            case ListNode.ListType.LOWER_ROMAN:
                list = document.createElement("ol");
                list.classList.add("betterchat-list-style-type-lower-roman");
                break;
            case ListNode.ListType.UPPER_ROMAN:
                list = document.createElement("ol");
                list.classList.add("betterchat-list-style-type-upper-roman");
                break;
            case ListNode.ListType.LOWER_ALPHA:
                list = document.createElement("ol");
                list.classList.add("betterchat-list-style-type-lower-alpha");
                break;
            case ListNode.ListType.UPPER_ALPHA:
                list = document.createElement("ol");
                list.classList.add("betterchat-list-style-type-upper-alpha");
                break;
            case ListNode.ListType.CIRCLE:
                list = document.createElement("ul");
                list.classList.add("betterchat-list-style-type-circle");
                break;
            case ListNode.ListType.SQUARE:
                list = document.createElement("ul");
                list.classList.add("betterchat-list-style-type-square");
                break;
            case ListNode.ListType.DISC:
            default:
                list = document.createElement("ul");
                list.classList.add("betterchat-list-style-type-disc");
                break;
        }
        this.parent.appendChild(list);
        const prevParent = this.parent;
        this.parent = list;
        for (const child of node.children) {
            if (child instanceof ListItemNode || child instanceof TaskListItemNode) {
                this.visit(child);
            }
        }
        this.parent = prevParent;
    }

    visitListItemNode(node: ListItemNode): void {
        const li = document.createElement("li");
        this.append(node, li);
    }

    visitTaskListItemNode(node: TaskListItemNode): void {
        const checkboxBackground = document.createElement("div");
        checkboxBackground.classList.add("ts-checkbox-background");
        const checkboxInner = document.createElement("div");
        checkboxInner.classList.add("ts-checkbox-inner");
        checkboxInner.appendChild(checkboxBackground);
        const checkbox = document.createElement("div");
        checkbox.classList.add("ts-checkbox", "inline");
        checkbox.appendChild(checkboxInner);
        const checkIcon = ImageLoader.loadIcon("check");
        if (checkIcon != null) {
            checkIcon.classList.add("ts-checkbox-checkmark");
            const path = checkIcon.querySelector("path")!!;
            path.style.stroke = "var(--tsv-icon-base)";
            path.classList.add("ts-checkbox-checkmark-path");
            (path.parentNode as Element)?.remove();
            checkIcon.appendChild(path);
            checkboxBackground.appendChild(checkIcon);
        }
        if (node.checked) {
            checkbox.dataset.checked = "true";
            checkboxBackground.classList.add("checked");
        } else {
            checkbox.dataset.checked = "false";
        }
        const li = document.createElement("li");
        li.appendChild(checkbox);
        this.append(node, li);
    }

    visitTableNode(node: TableNode): void {
        const table = document.createElement("table");
        table.classList.add("md-table");
        this.parent.appendChild(table);
        const prevParent = this.parent;
        this.parent = table;
        for (const child of node.children) {
            if (child instanceof TableRowNode) {
                this.visit(child);
            }
        }
        this.parent = prevParent;
    }

    visitTableRowNode(node: TableRowNode): void {
        const tr = document.createElement("tr");
        this.parent.appendChild(tr);
        const prevParent = this.parent;
        this.parent = tr;
        for (const child of node.children) {
            if (child instanceof TableHeaderNode || child instanceof TableDataNode) {
                this.visit(child);
            }
        }
        this.parent = prevParent;
    }

    visitTableHeaderNode(node: TableHeaderNode): void {
        const th = document.createElement("th");
        this.append(node, th);
    }

    visitTableDataNode(node: TableDataNode): void {
        const td = document.createElement("td");
        this.append(node, td);
    }

    visitMathNode(node: MathNode): void {
        const span = document.createElement("span");
        this.append(node, span);
        katex.render(span.textContent, span, {
            displayMode: true,
            output: "html",
            trust: false,
            throwOnError: false,
        });
        this.parent.appendChild(span);
    }

    visitInlineMathNode(node: InlineMathNode): void {
        const span = document.createElement("span");
        this.append(node, span);
        katex.render(span.textContent, span, {
            output: "html",
            trust: false,
            throwOnError: false,
        });
        this.parent.appendChild(span);
    }

    visitBlockquoteNode(node: BlockquoteNode): void {
        const blockquote = document.createElement("blockquote");
        switch (node.type) {
            case BlockquoteNode.BlockquoteType.NOTE:
                blockquote.classList.add("md-callout", "md-callout-note");
                blockquote.dataset.callout = "note";
                break;
            case BlockquoteNode.BlockquoteType.TIP:
                blockquote.classList.add("md-callout", "md-callout-tip");
                blockquote.dataset.callout = "tip";
                break;
            case BlockquoteNode.BlockquoteType.IMPORTANT:
                blockquote.classList.add("md-callout", "md-callout-important");
                blockquote.dataset.callout = "important";
                break;
            case BlockquoteNode.BlockquoteType.WARNING:
                blockquote.classList.add("md-callout", "md-callout-warning");
                blockquote.dataset.callout = "warning";
                break;
            case BlockquoteNode.BlockquoteType.CAUTION:
                blockquote.classList.add("md-callout", "md-callout-caution");
                blockquote.dataset.callout = "caution";
                break;
            default:
                break;
        }
        if (node.title != null) {
            const title = document.createElement("div");
            title.classList.add("md-callout-title");
            title.textContent = node.title;
            blockquote.appendChild(title);
        }
        this.append(node, blockquote);
    }

    visitMermaidNode(node: MermaidNode): void {
        const prevParent = this.parent;
        this.parent = document.createElement("span");
        this.visitChildren(node);
        const source = this.parent.textContent;
        this.parent = prevParent;
        const pre = document.createElement("pre");
        pre.textContent = source;
        pre.classList.add("language-mermaid");
        const title = document.createElement("div");
        title.classList.add("md-mermaid-meta-bar");
        title.textContent = "Diagram";
        const div = document.createElement("div");
        div.classList.add("md-offline-mermaid-preview");
        div.dataset.mermaidSource = source.trim();
        div.appendChild(title);
        div.appendChild(pre);
        this.parent.appendChild(div);
    }

    append(node: Node, element: Element, wrapper: Element = element): void {
        this.parent.appendChild(element);
        const prevParent = this.parent;
        this.parent = wrapper;
        this.visitChildren(node);
        this.parent = prevParent;
    }

    getSupportedNodeTypes(): string[] {
        return Nodes.ALL_NODE_TYPES;
    }

    get root(): HTMLElement {
        return this.context.output.message;
    }
}

class MessageRenderTarget implements RenderTarget {
    readonly message: HTMLElement = document.createElement("betterchat-message");
}

class DefaultMessageRenderer extends AbstractRenderer<MessageRenderTarget> {
    constructor() {
        super((context) => new MessageNodeRenderer(context));
    }

    createRenderTarget(): MessageRenderTarget {
        return new MessageRenderTarget();
    }
}

export namespace MessageRenderer {
    const messageRenderer = new DefaultMessageRenderer();

    export function render(node: Node): HTMLElement {
        return messageRenderer.render(node).message;
    }
}
