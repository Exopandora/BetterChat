const imagePreviewWidthPct = 0.65;
const imagePreviewHeightPct = 0.65;

export function ImagePreview(url: string, naturalWidth: number, naturalHeight: number): HTMLElement {
    const img = document.createElement("img");
    img.classList.add("betterchat-image-preview-image");
    img.src = url;
    img.onclick = (event: PointerEvent) => {
        event.stopPropagation();
        event.preventDefault();
    };
    resizeImagePreview(img, naturalWidth, naturalHeight);
    const link = document.createElement("a");
    link.classList.add("betterchat-image-preview-link");
    link.innerText = "View original";
    link.style.cursor = "pointer";
    link.onclick = (event: PointerEvent) => {
        window.open(url);
        event.stopPropagation();
        event.preventDefault();
    };
    const wrapper = document.createElement("div");
    wrapper.appendChild(img);
    wrapper.appendChild(link);
    const container = document.createElement("div");
    container.classList.add("betterchat-image-preview");
    container.appendChild(wrapper);
    container.onclick = (event: PointerEvent) => {
        container.remove();
        window.removeEventListener("resize", onWindowResize);
        event.stopPropagation();
        event.preventDefault();
    };
    window.addEventListener("resize", onWindowResize);
    return container;
}

function resizeImagePreview(previewImg: HTMLImageElement, naturalWidth: number, naturalHeight: number) {
    const maxPreviewWidth = document.body.clientWidth * imagePreviewWidthPct;
    const maxPreviewHeight = document.body.clientHeight * imagePreviewHeightPct;
    let width = naturalWidth;
    let height = naturalHeight;
    if (width > maxPreviewWidth) {
        height *= maxPreviewWidth / width;
        width = maxPreviewWidth;
    }
    if (height > maxPreviewHeight) {
        width *= maxPreviewHeight / height;
        height = maxPreviewHeight;
    }
    if (width < maxPreviewWidth && height < maxPreviewHeight) {
        if (maxPreviewWidth - width < maxPreviewHeight - height) {
            height *= maxPreviewWidth / width;
            width = maxPreviewWidth;
        } else {
            width *= maxPreviewHeight / height;
            height = maxPreviewHeight;
        }
    }
    previewImg.width = width;
    previewImg.height = height;
}

function onWindowResize() {
    const previewImg = document.querySelector("img.betterchat-image-preview-img");
    if (previewImg instanceof HTMLImageElement) {
        resizeImagePreview(previewImg, previewImg.naturalWidth, previewImg.naturalHeight);
    }
}
