import {getVueInstance} from "./Util";

export namespace ImageLoader {
    const iconData: { [key: string]: string } = getVueInstance(document.querySelector("#app"))?.$store?._vm?.IconData;

    export function loadIcon(name: string): SVGSVGElement | null {
        if (iconData == null) {
            return null;
        }
        const data = iconData[name];
        if (data == null) {
            return null;
        }
        return new DOMParser().parseFromString(data, "text/html").getElementsByTagName("svg")[0];
    }
}
