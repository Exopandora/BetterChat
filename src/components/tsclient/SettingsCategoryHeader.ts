export function SettingsCategoryHeader(name: string): HTMLElement {
    const title = document.createElement("div");
    title.classList.add("title");
    title.textContent = name;
    const header = document.createElement("div");
    header.classList.add("ts-widget-section-header");
    header.appendChild(title);
    return header;
}
