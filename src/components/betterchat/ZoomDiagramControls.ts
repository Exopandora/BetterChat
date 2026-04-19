import {ImageLoader} from "../../helpers/ImageLoader";

export function ZoomDiagramControls(panZoomInstance: SvgPanZoom.Instance): HTMLElement {
    const zoomIn = document.createElement("div");
    zoomIn.textContent = "+";
    zoomIn.classList.add("mermaid-diagram-control-element", "mermaid-diagram-control-element-zoom-in");
    zoomIn.addEventListener("click", (event: PointerEvent) => {
        panZoomInstance.zoomIn();
        event.stopPropagation();
        event.preventDefault();
    });
    const zoomOut = document.createElement("div");
    zoomOut.textContent = "\u2013";
    zoomOut.classList.add("mermaid-diagram-control-element", "mermaid-diagram-control-element-zoom-out");
    zoomOut.addEventListener("click", (event: PointerEvent) => {
        panZoomInstance.zoomOut();
        event.stopPropagation();
        event.preventDefault();
    });
    const zoom = document.createElement("div");
    zoom.classList.add("mermaid-diagram-control-element", "mermaid-diagram-control-element-zoom-scale");
    zoom.textContent = formatZoom(panZoomInstance.getZoom());
    panZoomInstance.setOnZoom((newScale: number) => {
        zoom.textContent = formatZoom(newScale);
    });
    const reset = document.createElement("div");
    reset.classList.add("mermaid-diagram-control-element", "mermaid-diagram-control-element-reset-zoom");
    ImageLoader.loadIcon("reset").then((svg) => {
        svg.style.removeProperty("fill");
        reset.appendChild(svg);
    });
    reset.addEventListener("click", (event: PointerEvent) => {
        panZoomInstance.reset();
        event.stopPropagation();
        event.preventDefault();
    });
    const controls = document.createElement("div");
    controls.classList.add("mermaid-diagram-controls");
    controls.appendChild(zoomIn);
    controls.appendChild(zoomOut);
    controls.appendChild(zoom);
    controls.appendChild(reset);
    return controls;
}

function formatZoom(scale: number) {
    return Math.round(scale * 100) + "%";
}
