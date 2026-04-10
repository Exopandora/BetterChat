export function SettingsCardWidget(settings: HTMLElement[]): HTMLElement {
    const content = document.createElement("div");
    content.classList.add("ts-card", "ts-widget", "full");
    for (const setting of settings) {
        content.appendChild(setting);
    }
    return content;
}
