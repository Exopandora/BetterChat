import {SettingsCardWidget} from "./SettingsCardWidget";
import {SettingsCategoryHeader} from "./SettingsCategoryHeader";

export function SettingsWidgetWrapper(title: string, ...settings: HTMLElement[]): HTMLElement {
    const widgetWrapper = document.createElement("div");
    widgetWrapper.classList.add("ts-widget-wrapper");
    widgetWrapper.appendChild(SettingsCategoryHeader(title));
    widgetWrapper.appendChild(SettingsCardWidget(...settings));
    return widgetWrapper;
}
