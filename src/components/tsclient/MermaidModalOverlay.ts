import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import {ZoomDiagramControls} from "../betterchat/ZoomDiagramControls";
import {ModalOverlay} from "./ModalOverlay";

export function MermaidModalOverlay(diagramSource: string): HTMLElement {
    let panZoomInstance: SvgPanZoom.Instance;
    const resizeObserver = new ResizeObserver(() => {
        if (panZoomInstance != null) {
            panZoomInstance.fit();
            panZoomInstance.resize();
        }
    });
    const customizeContents = (container: HTMLElement) => {
        const pre = document.createElement("pre");
        pre.textContent = diagramSource;
        const div = document.createElement("div");
        div.classList.add("mermaid-diagram-preview");
        div.appendChild(pre);
        container.classList.add("generic");
        container.appendChild(div);
        mermaid.run({
            nodes: [pre],
        }).then(() => {
            panZoomInstance = svgPanZoom(pre.querySelector("svg")!!, {
                fit: true,
                center: true,
            });
            resizeObserver.observe(div);
            div.appendChild(ZoomDiagramControls(panZoomInstance));
        }).catch((err) => {
            console.error(err.str);
        });
    };
    const onDestroy = () => {
        if (panZoomInstance != null) {
            panZoomInstance.destroy();
        }
        resizeObserver.disconnect();
    };
    return ModalOverlay("diagram", customizeContents, { onDestroy });
}
