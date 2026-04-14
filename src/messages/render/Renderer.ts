import {Node} from "../node/Node";

export interface Renderer<T extends RenderTarget> {
    render(node: Node): T;
}

export interface RenderTarget {}

export interface NodeRenderer {
    afterRoot(node: Node): void;

    render(node: Node): void;

    beforeRoot(node: Node): void;

    getSupportedNodeTypes(): string[];
}

export interface NodeRendererFactory<T extends RenderTarget> {
    (context: RenderContext<T>): NodeRenderer
}

export abstract class AbstractRenderer<T extends RenderTarget> implements Renderer<T> {
    readonly renderFactories: NodeRendererFactory<T>[] = [];

    abstract createRenderTarget(): T;

    protected constructor(renderFactory: NodeRendererFactory<T>, ...renderFactories: NodeRendererFactory<T>[]) {
        this.renderFactories.push(renderFactory);
        this.renderFactories.push(...renderFactories);
    }

    render(node: Node): T {
        const context = new RenderContext(this.createRenderTarget(), this.renderFactories);
        context.beforeRoot(node);
        context.render(node);
        context.afterRoot(node);
        return context.output;
    }
}

export class RenderContext<T extends RenderTarget> {
    private readonly nodeRendererMap: Map<string, NodeRenderer> = new Map<string, NodeRenderer>();
    private readonly nodeRendererList: NodeRenderer[] = [];
    readonly output: T;

    constructor(output: T, renderFactories: NodeRendererFactory<T>[]) {
        this.output = output;
        for (const renderFactory of renderFactories) {
            const nodeRenderer = renderFactory(this);
            this.nodeRendererList.push(nodeRenderer);
            for (const nodeType of nodeRenderer.getSupportedNodeTypes()) {
                if (!this.nodeRendererMap.has(nodeType)) {
                    this.nodeRendererMap.set(nodeType, nodeRenderer);
                }
            }
        }
    }

    render(node: Node): void {
        this.nodeRendererMap.get(node.constructor.name)?.render(node);
    }

    beforeRoot(node: Node): void {
        this.nodeRendererList.forEach((renderer) => renderer.beforeRoot(node));
    }

    afterRoot(node: Node): void {
        this.nodeRendererList.forEach((renderer) => renderer.afterRoot(node));
    }
}
