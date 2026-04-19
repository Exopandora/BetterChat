import {Visitor} from "./Visitor";

export abstract class Node {
    readonly children: Node[];

    protected constructor(children: Node[]) {
        this.children = children;
    }

    accept(visitor: Visitor) {
        visitor.visit(this);
    }
}

export class DocumentNode extends Node {
    constructor(children: Node[]) {
        super(children);
    }
}

export class StringNode extends Node {
    readonly string: string;

    constructor(string: string) {
        super([]);
        this.string = string;
    }
}

export class UrlNode extends Node {
    readonly url: string;

    constructor(url: string, children: Node[] = []) {
        super(children);
        this.url = url;
    }
}

export class BoldNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class UnderlineNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class ItalicNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class StrikethroughNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class ColorNode extends Node {
    readonly color: string;

    constructor(color: string, children: Node[] = []) {
        super(children);
        this.color = color;
    }
}

export class SpoilerNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class InlineCodeNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class CodeNode extends Node {
    readonly language: string | null;

    constructor(language: string | null, children: Node[] = []) {
        super(children);
        this.language = language;
    }
}

export class EmojiNode extends Node {
    readonly node: HTMLElement;

    constructor(node: HTMLElement) {
        super([]);
        this.node = node;
    }
}

export class SuperscriptNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class SubscriptNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class DetailsNode extends Node {
    readonly summary: string | null;

    constructor(summary: string | null, children: Node[] = []) {
        super(children);
        this.summary = summary;
    }
}

export class ThematicBreakNode extends Node {
    constructor() {
        super([]);
    }
}

export class HeadingNode extends Node {
    readonly size: number;

    constructor(size: number, children: Node[] = []) {
        super(children);
        this.size = size < 0 ? 1 : (size > 6 ? 6 : size);
    }
}

export class CenterAlignNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class RightAlignNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class LeftAlignNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class HighlightNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class FootnoteNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class ListNode extends Node {
    readonly type: ListNode.ListType;

    constructor(type: ListNode.ListType, children: Node[] = []) {
        super(children);
        this.type = type;
    }
}

export namespace ListNode {
    export enum ListType {
        // unordered
        DISC,
        CIRCLE,
        SQUARE,
        // ordered
        DECIMAL,
        LOWER_ROMAN,
        UPPER_ROMAN,
        LOWER_ALPHA,
        UPPER_ALPHA,
    }
}

export class ListItemNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class TaskListItemNode extends Node {
    readonly checked: boolean;

    constructor(checked: boolean, children: Node[] = []) {
        super(children);
        this.checked = checked;
    }
}

export class TableNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class TableRowNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class TableHeaderNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class TableDataNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class MathNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class InlineMathNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export class BlockquoteNode extends Node {
    readonly title: string | null;
    readonly type: BlockquoteNode.BlockquoteType

    constructor(title: string | null, type: BlockquoteNode.BlockquoteType, children: Node[] = []) {
        super(children);
        this.title = title;
        this.type = type;
    }
}

export namespace BlockquoteNode {
    export enum BlockquoteType {
        DEFAULT,
        NOTE,
        TIP,
        IMPORTANT,
        WARNING,
        CAUTION,
    }
}

export class MermaidNode extends Node {
    constructor(children: Node[] = []) {
        super(children);
    }
}

export namespace Nodes {
    export const ALL_NODE_TYPES = [
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
        SubscriptNode.name,
        DetailsNode.name,
        ThematicBreakNode.name,
        HeadingNode.name,
        CenterAlignNode.name,
        RightAlignNode.name,
        LeftAlignNode.name,
        HighlightNode.name,
        FootnoteNode.name,
        ListNode.name,
        ListItemNode.name,
        TableNode.name,
        TableRowNode.name,
        TableHeaderNode.name,
        TableDataNode.name,
        MathNode.name,
        InlineMathNode.name,
        BlockquoteNode.name,
        MermaidNode.name,
        TaskListItemNode.name,
    ];
}
