export namespace ImageLoader {
    const cache: Map<string, HTMLElement> = new Map<string, HTMLElement>();

    export async function loadIcon(name: string): Promise<HTMLElement> {
        if (cache.has(name)) {
            return Promise.resolve(cache.get(name)!!.cloneNode(true) as HTMLElement);
        }
        const response = await fetch(`tsui://default/images/icons/${name}.svg`);
        const text = await response.text();
        const svg = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
        removeTsvClasses(svg);
        cache.set(name, svg);
        return svg;
    }

    function removeTsvClasses(element: Element) {
        const remove: string[] = [];
        element.classList.forEach((value) => {
            if (value.startsWith("ts")) {
                remove.push(value);
            }
        });
        element.classList.remove(...remove);
        for (const child of element.children) {
            removeTsvClasses(child);
        }
    }
}
