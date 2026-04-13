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
