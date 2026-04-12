import {Settings} from "../../helpers/Settings";

export function ToggleSetting(title: string, description: string, configKey: string, settings: Settings): HTMLElement {
    const titleSpan = document.createElement("span");
    titleSpan.textContent = title;
    const descriptionP = document.createElement("p");
    descriptionP.classList.add("ts-card-subtitle");
    descriptionP.textContent = description;
    const label = document.createElement("label");
    label.classList.add("tsv-flex-column");
    label.setAttribute("for", "ts-toggle-4");
    label.appendChild(titleSpan);
    label.appendChild(descriptionP);
    const input = document.createElement("input");
    input.type = "checkbox";
    const toggleInner = document.createElement("div");
    toggleInner.classList.add("ts-toggle-inner", "visible");
    toggleInner.appendChild(input);
    const toggle = document.createElement("div");
    toggle.classList.add("ts-toggle", "visible");
    const updateToggle = (enabled: boolean) => {
        if (enabled) {
            toggle.classList.add("checked");
            toggleInner.classList.add("checked");
        } else if (toggle.classList.contains("checked")) {
            toggle.classList.remove("checked");
            toggleInner.classList.remove("checked");
        }
    };
    updateToggle(settings.getValueForKey(configKey));
    toggle.appendChild(toggleInner);
    const toggleWrapper = document.createElement("div");
    toggleWrapper.classList.add("ts-toggle-wrapper", "ts-flex", "row");
    toggleWrapper.onclick = () => {
        const enabled = !settings.getValueForKey(configKey);
        settings.setValueForKey(configKey, enabled);
        updateToggle(enabled);
    };
    toggleWrapper.appendChild(label);
    toggleWrapper.appendChild(toggle);
    const container = document.createElement("div");
    container.classList.add("ts-card-setting-container");
    container.appendChild(toggleWrapper);
    return container;
}
