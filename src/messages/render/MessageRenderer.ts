import katex from "katex";
import mermaid from "mermaid";
import {MaximizeDiagramControls} from "../../components/betterchat/MaximizeDiagramControls";
import {MermaidModalOverlay} from "../../components/tsclient/MermaidModalOverlay";
import {ModalHelper} from "../../helpers/ModalHelper";
import {Tooltips} from "../../helpers/Tooltips";
import {getVueInstance, setClipboardString} from "../../helpers/Util";
import {
    BlockquoteNode,
    BoldNode,
    CenterAlignNode,
    CodeNode,
    ColorNode,
    DetailsNode,
    EmojiNode,
    FootnoteNode,
    HeadingNode,
    HighlightNode,
    InlineCodeNode,
    InlineMathNode,
    ItalicNode,
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
    ThematicBreakNode,
    UnderlineNode,
    UrlNode
} from "../node/Node";
import {AbstractVisitor} from "../node/Visitor";
import {AbstractRenderer, NodeRenderer, RenderContext, RenderTarget} from "./Renderer";

mermaid.initialize({
    securityLevel: "antiscript",
    startOnLoad: false,
    theme: "dark",
});

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
    private parent: HTMLElement;
    private footnotes: HTMLElement[] = [];
    private insideTable: boolean = false;

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
            for (let x = 0; x < this.footnotes.length; x++) {
                const sup = document.createElement("sup");
                sup.textContent = (x + 1).toString();
                this.root.appendChild(sup);
                this.root.appendChild(this.footnotes[x]);
                if (x + 1 < this.footnotes.length) {
                    const newline = document.createElement("span");
                    newline.textContent = "\n";
                    this.root.appendChild(newline);
                }
            }
        }
    }

    visitBoldNode(node: BoldNode): void {
        const strong = document.createElement("strong");
        this.append(node, strong);
    }

    visitInlineCodeNode(node: InlineCodeNode): void {
        const code = document.createElement("code");
        code.classList.add("inline-code");
        this.append(node, code);
    }

    visitCodeNode(node: CodeNode): void {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.classList.add("hljs");
        pre.appendChild(code);
        this.append(node, code);
        const app = getVueInstance(document.body.querySelector("#app"));
        if (app != null) {
            const config = {
                code: code.textContent,
                lang: node.language,
                onlyUpdate: false,
                withLangHtml: false,
            };
            app.$options.directives.highlightjs.bind(code, {value: config});
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
        const p = document.createElement("p");
        p.classList.add("spoiler");
        p.classList.add("has-tooltip");
        p.ariaHidden = "true";
        p.dataset.originalTitle = "null";
        this.append(node, p);
        const childTooltips = Tooltips.create(p, "Click to reveal spoiler");
        p.onclick = (event: PointerEvent) => {
            p.setAttribute("visible", "true");
            Tooltips.destroy(p);
            Tooltips.enableAll(childTooltips);
            event.stopPropagation();
            event.preventDefault();
        };
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
        const span = document.createElement("span");
        span.style.textDecoration = "underline";
        this.append(node, span);
    }

    visitUrlNode(node: UrlNode): void {
        const a = document.createElement("a");
        a.target = "_blank";
        a.rel = "noreferrer noopener";
        a.tabIndex = -1;
        a.dataset.originalTitle = "null";
        a.style.display = "inline-block";
        this.append(node, a);
        let href = node.url || a.textContent;
        if (href.match(/^\w+:\/\/\S+$/) == null) {
            href = "https://" + href;
        }
        const invalid = href.match(/^((?:(?:https?|ts3file|ts3server|teamspeak):\/\/|www\.)[^\s<>\[\]]+[^<>.,:;"')\[\]\s])$/) == null;
        if (invalid) {
            a.classList.add("betterchat-invalid-link");
        }
        a.href = href;
        a.onclick = (event: PointerEvent) => {
            if (invalid) {
                setClipboardString(a.href);
                Tooltips.setTooltipContentUntilHidden(a, "Copied to clipboard!");
            } else {
                window.open(href);
            }
            event.stopPropagation();
            event.preventDefault();
        };
        Tooltips.create(a, "Links to: " + href);
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
        const summary = document.createElement("summary");
        summary.textContent = node.summary ?? "Click to expand";
        details.appendChild(summary);
        this.append(node, details);
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
        const span = document.createElement("span");
        span.style.display = "flex";
        span.style.justifyContent = "center";
        if (!this.insideTable) {
            this.root.dataset.renderFullWidth = "true";
        }
        this.append(node, span);
    }

    visitRightAlignNode(node: RightAlignNode): void {
        const span = document.createElement("span");
        span.style.display = "flex";
        span.style.justifyContent = "right";
        if (!this.insideTable) {
            this.root.dataset.renderFullWidth = "true";
        }
        this.append(node, span);
    }

    visitLeftAlignNode(node: LeftAlignNode): void {
        const span = document.createElement("span");
        span.style.display = "flex";
        span.style.justifyContent = "left";
        if (!this.insideTable) {
            this.root.dataset.renderFullWidth = "true";
        }
        this.append(node, span);
    }

    visitHighlightNode(node: HighlightNode): void {
        const span = document.createElement("span");
        span.classList.add("highlighted-text-snippet");
        this.append(node, span);
    }

    visitFootnoteNode(node: FootnoteNode): void {
        const sup = document.createElement("sup");
        sup.textContent = (this.footnotes.length + 1).toString();
        this.parent.appendChild(sup);
        const prevParent = this.parent;
        this.parent = document.createElement("span");
        this.visitChildren(node);
        this.footnotes.push(this.parent);
        this.parent = prevParent;
    }

    visitListNode(node: ListNode): void {
        let list;
        switch (node.type) {
            case ListNode.ListType.ORDERED:
                list = document.createElement("ol");
                break;
            case ListNode.ListType.UNORDERED:
                list = document.createElement("ul");
                break;
        }
        this.parent.appendChild(list);
        const prevParent = this.parent;
        this.parent = list;
        for (const child of node.children) {
            if (child instanceof ListItemNode) {
                this.visit(child);
            }
        }
        this.parent = prevParent;
    }

    visitListItemNode(node: ListItemNode): void {
        const li = document.createElement("li");
        this.append(node, li);
    }

    visitTableNode(node: TableNode): void {
        const table = document.createElement("table");
        this.parent.appendChild(table);
        const prevParent = this.parent;
        this.parent = table;
        this.insideTable = true;
        for (const child of node.children) {
            if (child instanceof TableRowNode) {
                this.visit(child);
            }
        }
        this.insideTable = false;
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
                blockquote.classList.add("callout-note");
                break;
            case BlockquoteNode.BlockquoteType.TIP:
                blockquote.classList.add("callout-tip");
                break;
            case BlockquoteNode.BlockquoteType.IMPORTANT:
                blockquote.classList.add("callout-important");
                break;
            case BlockquoteNode.BlockquoteType.WARNING:
                blockquote.classList.add("callout-warning");
                break;
            case BlockquoteNode.BlockquoteType.CAUTION:
                blockquote.classList.add("callout-caution");
                break;
            default:
                break;
        }
        const content = document.createElement("div");
        content.classList.add("blockquote-content-wrapper");
        blockquote.appendChild(content);
        if (node.title != null) {
            const title = document.createElement("p");
            title.classList.add("blockquote-title");
            title.textContent = node.title;
            content.appendChild(title);
        }
        this.parent.appendChild(blockquote);
        const prevParent = this.parent;
        this.parent = content;
        this.visitChildren(node);
        this.parent = prevParent;
    }

    visitMermaidNode(node: MermaidNode): void {
        const pre = document.createElement("pre");
        const prevParent = this.parent;
        this.parent = document.createElement("span");
        this.visitChildren(node);
        const source = this.parent.textContent;
        pre.textContent = source;
        this.parent = prevParent;
        const div = document.createElement("div");
        div.classList.add("mermaid-diagram-preview");
        div.appendChild(pre);
        this.parent.appendChild(div);
        mermaid.run({
            nodes: [pre],
        }).then(() => {
            div.appendChild(MaximizeDiagramControls(() => {
                ModalHelper.show(MermaidModalOverlay(source));
            }));
        }).catch((error) => {
            pre.textContent = error.str;
        });
    }

    append(node: Node, element: HTMLElement): void {
        this.parent.appendChild(element);
        const prevParent = this.parent;
        this.parent = element;
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
