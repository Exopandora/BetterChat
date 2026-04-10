import {Node} from "../node/Node";

export interface Renderer<T extends RenderOutput> {
    render(node: Node): T;
}

export interface RenderOutput {}

export interface NodeRenderer {
    afterRoot(node: Node): void;

    render(node: Node): void;

    beforeRoot(node: Node): void;

    getSupportedNodeTypes(): string[];
}

export interface NodeRendererFactory<T extends RenderOutput> {
    (context: RenderContext<T>): NodeRenderer
}

export abstract class AbstractRenderer<T extends RenderOutput> implements Renderer<T> {
    readonly renderFactories: NodeRendererFactory<T>[] = [];

    abstract createRenderOutput(): T;

    protected constructor(renderFactory: NodeRendererFactory<T>, ...renderFactories: NodeRendererFactory<T>[]) {
        this.renderFactories.push(renderFactory);
        this.renderFactories.push(...renderFactories);
    }

    render(node: Node): T {
        const context = new RenderContext(this.createRenderOutput(), this.renderFactories);
        context.beforeRoot(node);
        context.render(node);
        context.afterRoot(node);
        return context.output;
    }
}

export class RenderContext<T extends RenderOutput> {
    private readonly nodeRenderers: Map<string, NodeRenderer> = new Map<string, NodeRenderer>();
    readonly output: T;

    constructor(output: T, renderFactories: NodeRendererFactory<T>[]) {
        this.output = output;
        for (const renderFactory of renderFactories) {
            const nodeRenderer = renderFactory(this);
            for (const nodeType of nodeRenderer.getSupportedNodeTypes()) {
                if (!this.nodeRenderers.has(nodeType)) {
                    this.nodeRenderers.set(nodeType, nodeRenderer);
                }
            }
        }
    }

    render(node: Node): void {
        this.nodeRenderers.get(node.constructor.name)?.render(node);
    }

    beforeRoot(node: Node): void {
        this.nodeRenderers.values().forEach((renderer) => renderer.beforeRoot(node));
    }

    afterRoot(node: Node): void {
        this.nodeRenderers.values().forEach((renderer) => renderer.afterRoot(node));
    }
}
