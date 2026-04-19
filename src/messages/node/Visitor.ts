import {
    BlockquoteNode,
    BoldNode,
    CenterAlignNode,
    CodeNode,
    ColorNode,
    DetailsNode,
    DocumentNode,
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
} from "./Node";

export interface Visitor {
    visit(node: Node): void;
    visitStringNode(node: StringNode): void;
    visitUrlNode(node: UrlNode): void;
    visitBoldNode(node: BoldNode): void;
    visitUnderlineNode(node: UnderlineNode): void;
    visitItalicNode(node: ItalicNode): void;
    visitStrikethroughNode(node: StrikethroughNode): void;
    visitColorNode(node: ColorNode): void;
    visitSpoilerNode(node: SpoilerNode): void;
    visitInlineCodeNode(node: InlineCodeNode): void;
    visitCodeNode(node: CodeNode): void;
    visitEmojiNode(node: EmojiNode): void;
    visitSuperscriptNode(node: SuperscriptNode): void;
    visitSubscriptNode(node: SubscriptNode): void;
    visitDetailsNode(node: DetailsNode): void;
    visitThematicBreakNode(node: ThematicBreakNode): void;
    visitHeadingNode(node: HeadingNode): void;
    visitCenterAlignNode(node: CenterAlignNode): void;
    visitRightAlignNode(node: RightAlignNode): void;
    visitLeftAlignNode(node: LeftAlignNode): void;
    visitHighlightNode(node: HighlightNode): void;
    visitFootnoteNode(node: FootnoteNode): void;
    visitListNode(node: ListNode): void;
    visitListItemNode(node: ListItemNode): void;
    visitDocumentNode(node: DocumentNode): void;
}

export abstract class AbstractVisitor implements Visitor {
    visit(node: Node): void {
        if (node instanceof StringNode) {
            this.visitStringNode(node);
        } else if (node instanceof UrlNode) {
            this.visitUrlNode(node);
        } else if (node instanceof BoldNode) {
            this.visitBoldNode(node);
        } else if (node instanceof UnderlineNode) {
            this.visitUnderlineNode(node);
        } else if (node instanceof ItalicNode) {
            this.visitItalicNode(node);
        } else if (node instanceof StrikethroughNode) {
            this.visitStrikethroughNode(node);
        } else if (node instanceof ColorNode) {
            this.visitColorNode(node);
        } else if (node instanceof SpoilerNode) {
            this.visitSpoilerNode(node);
        } else if (node instanceof InlineCodeNode) {
            this.visitInlineCodeNode(node);
        } else if (node instanceof CodeNode) {
            this.visitCodeNode(node);
        } else if (node instanceof EmojiNode) {
            this.visitEmojiNode(node);
        } else if (node instanceof SuperscriptNode) {
            this.visitSuperscriptNode(node);
        } else if (node instanceof SubscriptNode) {
            this.visitSubscriptNode(node);
        } else if (node instanceof DetailsNode) {
            this.visitDetailsNode(node);
        } else if (node instanceof ThematicBreakNode) {
            this.visitThematicBreakNode(node);
        } else if (node instanceof HeadingNode) {
            this.visitHeadingNode(node);
        } else if (node instanceof CenterAlignNode) {
            this.visitCenterAlignNode(node);
        } else if (node instanceof RightAlignNode) {
            this.visitRightAlignNode(node);
        } else if (node instanceof LeftAlignNode) {
            this.visitLeftAlignNode(node);
        } else if (node instanceof HighlightNode) {
            this.visitHighlightNode(node);
        } else if (node instanceof FootnoteNode) {
            this.visitFootnoteNode(node);
        } else if (node instanceof ListNode) {
            this.visitListNode(node);
        } else if (node instanceof ListItemNode) {
            this.visitListItemNode(node);
        } else if (node instanceof TableNode) {
            this.visitTableNode(node);
        } else if (node instanceof TableRowNode) {
            this.visitTableRowNode(node);
        } else if (node instanceof TableHeaderNode) {
            this.visitTableHeaderNode(node);
        } else if (node instanceof TableDataNode) {
            this.visitTableDataNode(node);
        } else if (node instanceof MathNode) {
            this.visitMathNode(node);
        } else if (node instanceof InlineMathNode) {
            this.visitInlineMathNode(node);
        } else if (node instanceof BlockquoteNode) {
            this.visitBlockquoteNode(node);
        } else if (node instanceof MermaidNode) {
            this.visitMermaidNode(node);
        } else if (node instanceof DocumentNode) {
            this.visitDocumentNode(node);
        }
    }

    visitBoldNode(node: BoldNode): void {
        this.visitChildren(node);
    }

    visitInlineCodeNode(node: InlineCodeNode): void {
        this.visitChildren(node);
    }

    visitCodeNode(node: CodeNode): void {
        this.visitChildren(node);
    }

    visitColorNode(node: ColorNode): void {
        this.visitChildren(node);
    }

    visitEmojiNode(node: EmojiNode): void {
        this.visitChildren(node);
    }

    visitItalicNode(node: ItalicNode): void {
        this.visitChildren(node);
    }

    visitSpoilerNode(node: SpoilerNode): void {
        this.visitChildren(node);
    }

    visitStrikethroughNode(node: StrikethroughNode): void {
        this.visitChildren(node);
    }

    visitStringNode(node: StringNode): void {
        this.visitChildren(node);
    }

    visitUnderlineNode(node: UnderlineNode): void {
        this.visitChildren(node);
    }

    visitUrlNode(node: UrlNode): void {
        this.visitChildren(node);
    }

    visitSuperscriptNode(node: SuperscriptNode): void {
        this.visitChildren(node);
    }

    visitSubscriptNode(node: SubscriptNode): void {
        this.visitChildren(node);
    }

    visitDetailsNode(node: DetailsNode): void {
        this.visitChildren(node);
    }

    visitThematicBreakNode(node: ThematicBreakNode): void {
        this.visitChildren(node);
    }

    visitHeadingNode(node: HeadingNode): void {
        this.visitChildren(node);
    }

    visitCenterAlignNode(node: CenterAlignNode): void {
        this.visitChildren(node);
    }

    visitRightAlignNode(node: RightAlignNode): void {
        this.visitChildren(node);
    }

    visitLeftAlignNode(node: LeftAlignNode): void {
        this.visitChildren(node);
    }

    visitHighlightNode(node: HighlightNode): void {
        this.visitChildren(node);
    }

    visitFootnoteNode(node: FootnoteNode): void {
        this.visitChildren(node);
    }

    visitListNode(node: ListNode): void {
        this.visitChildren(node);
    }

    visitListItemNode(node: ListItemNode): void {
        this.visitChildren(node);
    }

    visitTableNode(node: TableNode): void {
        this.visitChildren(node);
    }

    visitTableRowNode(node: TableRowNode): void {
        this.visitChildren(node);
    }

    visitTableHeaderNode(node: TableHeaderNode): void {
        this.visitChildren(node);
    }

    visitTableDataNode(node: TableDataNode): void {
        this.visitChildren(node);
    }

    visitMathNode(node: MathNode): void {
        this.visitChildren(node);
    }

    visitInlineMathNode(node: InlineMathNode): void {
        this.visitChildren(node);
    }

    visitBlockquoteNode(node: BlockquoteNode): void {
        this.visitChildren(node);
    }

    visitMermaidNode(node: MermaidNode): void {
        this.visitChildren(node);
    }

    visitDocumentNode(node: DocumentNode): void {
        this.visitChildren(node);
    }

    visitChildren(node: Node): void {
        node.children.forEach((child) => this.visit(child));
    }
}
