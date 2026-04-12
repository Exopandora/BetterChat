import {Tooltips} from "../../helpers/Tooltips";
import {getVueInstance, setClipboardString} from "../../helpers/Util";
import {
    BoldNode,
    CodeNode,
    ColorNode,
    DocumentNode,
    EmojiNode,
    InlineCodeNode,
    ItalicNode,
    Node,
    SpoilerNode,
    StrikethroughNode,
    StringNode, SuperscriptNode,
    UnderlineNode,
    UrlNode
} from "../node/Node";
import {AbstractVisitor} from "../node/Visitor";
import {AbstractRenderer, NodeRenderer, RenderContext, RenderTarget} from "./Renderer";

class MessageNodeRenderer extends AbstractVisitor implements NodeRenderer {
    private parent: HTMLElement;

    constructor(context: RenderContext<MessageRenderTarget>) {
        super();
        this.parent = context.output.message;
    }

    beforeRoot(_: Node): void {

    }

    render(node: Node): void {
        node.accept(this);
    }

    afterRoot(_: Node): void {

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
        this.append(node, span);
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

    append(node: Node, element: HTMLElement): void {
        this.parent.appendChild(element);
        const prevParent = this.parent;
        this.parent = element;
        this.visitChildren(node);
        this.parent = prevParent;
    }

    getSupportedNodeTypes(): string[] {
        return [
            DocumentNode.name,
            StringNode.name,
            UrlNode.name,
            BoldNode.name,
            UnderlineNode.name,
            ItalicNode.name,
            StrikethroughNode.name,
            ColorNode.name,
            SpoilerNode.name,
            InlineCodeNode.name,
            CodeNode.name,
            EmojiNode.name,
            SuperscriptNode.name,
        ]
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
