import {ImageLoader} from "../../helpers/ImageLoader";

export function MaximizeDiagramControls(onMaximize: () => void): HTMLElement {
    const maximize = document.createElement("div");
    maximize.classList.add("mermaid-diagram-control-element");
    const streamMaximizeIcon = ImageLoader.loadIcon("stream-maximize");
    if (streamMaximizeIcon != null) {
        maximize.appendChild(streamMaximizeIcon);
    }
    maximize.addEventListener("click", (event: PointerEvent) => {
        onMaximize();
        event.stopPropagation();
        event.preventDefault();
    });
    const controls = document.createElement("div");
    controls.classList.add("mermaid-diagram-controls");
    controls.appendChild(maximize);
    return controls;
}
