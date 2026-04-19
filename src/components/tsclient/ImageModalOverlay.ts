import {ModalOverlay} from "./ModalOverlay";

export function ImageModalOverlay(url: string): HTMLElement {
    const image = document.createElement("img");
    image.src = url;
    image.classList.add("keep-size");
    image.setAttribute("data-v-8beca902", "");
    const onModalDoubleClicked = () => {
        if (image.classList.contains("contain")) {
            image.classList.remove("contain");
            image.classList.add("keep-size");
        } else if (image.classList.contains("keep-size")) {
            image.classList.remove("keep-size");
            image.classList.add("contain");
        }
    };
    const customizeContents = (container: HTMLElement) => {
        container.classList.add("image");
        container.appendChild(image);
    };
    const label = document.createElement("a");
    label.textContent = "image";
    label.style.cursor = "pointer";
    label.addEventListener("click", (event: PointerEvent) => {
        window.open(url);
        event.stopPropagation();
        event.preventDefault();
    });
    return ModalOverlay(label, customizeContents, { onModalDoubleClicked });
}
