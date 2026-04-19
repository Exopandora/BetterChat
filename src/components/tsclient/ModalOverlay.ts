import {ImageLoader} from "../../helpers/ImageLoader";

export function ModalOverlay(
    label: HTMLElement | string,
    contentFactory: (container: HTMLElement) => void,
    callbacks?: {
        onModalDoubleClicked?: () => void,
        onDestroy?: () => void,
    },
): HTMLElement {
    const lightBoxContentPlatterInner = document.createElement("div");
    lightBoxContentPlatterInner.classList.add("ts-lightbox-content-platter-inner");
    lightBoxContentPlatterInner.setAttribute("data-v-8beca902", "");
    contentFactory(lightBoxContentPlatterInner);
    const itemIconStack = document.createElement("div");
    itemIconStack.classList.add("tsv-icon", "tsv-item-icon-stack");
    ImageLoader.loadIcon("item_close").then((svg) => {
        for (const path of svg.querySelectorAll("path")) {
            path.classList.add("tsv-icon-base-fill");
        }
        svg.classList.add("tsv-icon");
        svg.setAttribute("role", "presentation");
        svg.setAttribute("width", "22");
        svg.setAttribute("height", "22");
        itemIconStack.appendChild(svg);
    }).catch((err) => {
        console.error(err);
    });
    const iconStack = document.createElement("div");
    iconStack.classList.add("tsv-icon", "tsv-icon-stack");
    iconStack.appendChild(itemIconStack);
    const lightBoxCloseBox = document.createElement("div");
    lightBoxCloseBox.classList.add("tsv-button", "tsv-action-subtle", "ts-lightbox-closebox", "tsv-button-plain", "tsv-button-has-image");
    lightBoxCloseBox.setAttribute("data-v-8beca902", "");
    lightBoxCloseBox.appendChild(iconStack);
    const lightBoxContentPlatterOverlay = document.createElement("div");
    lightBoxContentPlatterOverlay.classList.add("ts-lightbox-content-platter-overlay");
    // do not set "data-v-8beca902" attribute on lightBoxContentPlatterOverlay, so contents stay interactable
    // this is a difference to the vanilla ts client
    // lightBoxContentPlatterOverlay.setAttribute("data-v-8beca902", "");
    lightBoxContentPlatterOverlay.appendChild(lightBoxCloseBox);
    const caption = document.createElement("span");
    caption.setAttribute("data-v-8beca902", "");
    if (label instanceof HTMLElement) {
        caption.appendChild(label);
    } else {
        caption.textContent = label;
    }
    const lightBoxContentFooterActions = document.createElement("div");
    lightBoxContentFooterActions.classList.add("ts-lightbox-content-footer-actions");
    lightBoxContentFooterActions.setAttribute("data-v-8beca902", "");
    const lightBoxContentFooter = document.createElement("div");
    lightBoxContentFooter.classList.add("ts-lightbox-content-footer");
    lightBoxContentFooter.setAttribute("data-v-8beca902", "");
    lightBoxContentFooter.appendChild(caption);
    lightBoxContentFooter.appendChild(lightBoxContentFooterActions);
    const lightBoxContentPlatter = document.createElement("div");
    lightBoxContentPlatter.classList.add("ts-lightbox-content-platter");
    lightBoxContentPlatter.setAttribute("data-v-8beca902", "");
    lightBoxContentPlatter.appendChild(lightBoxContentPlatterInner);
    lightBoxContentPlatter.appendChild(lightBoxContentPlatterOverlay);
    const lightBoxContentBasis = document.createElement("div");
    lightBoxContentBasis.classList.add("ts-lightbox-content-basis");
    lightBoxContentBasis.setAttribute("data-v-8beca902", "");
    lightBoxContentBasis.appendChild(lightBoxContentPlatter);
    lightBoxContentBasis.appendChild(lightBoxContentFooter);
    lightBoxContentBasis.addEventListener("dblclick", (event: MouseEvent) => {
        if (callbacks?.onModalDoubleClicked != null) {
            callbacks.onModalDoubleClicked();
        }
        event.stopPropagation();
        event.preventDefault();
    });
    lightBoxContentBasis.addEventListener("click",  (event: PointerEvent) => {
        event.stopPropagation();
        event.preventDefault();
    });
    const lightBox = document.createElement("div");
    lightBox.classList.add("ts-lightbox");
    lightBox.setAttribute("data-v-8beca902", "");
    lightBox.appendChild(lightBoxContentBasis);
    const modalOverlayRoot = document.createElement("div");
    modalOverlayRoot.classList.add("tsv-modal-overlay", "root");
    if (callbacks?.onDestroy != null) {
        (modalOverlayRoot as any).onDestroy = callbacks.onDestroy;
    }
    modalOverlayRoot.appendChild(lightBox);
    const closeModalHandler = (event: PointerEvent) => {
        if (callbacks?.onDestroy != null) {
            callbacks.onDestroy();
        }
        modalOverlayRoot.remove();
        event.stopPropagation();
        event.preventDefault();
    };
    iconStack.addEventListener("click", closeModalHandler);
    modalOverlayRoot.addEventListener("click", closeModalHandler);
    return modalOverlayRoot;
}
