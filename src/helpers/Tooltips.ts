import tippy, {Content, Instance} from "tippy.js";

const tooltips: Instance[] = [];

export namespace Tooltips {
    export function create(element: Element, text: Content): Element[] {
        tooltips.push(tippy(element, {content: text}));
        return disableNestedTooltips(element);
    }

    export function destroy(element: Element, recursive: boolean = false) {
        const tippyInstance = getTippyInstance(element);
        if (tippyInstance != null) {
            tippyInstance.destroy();
            const index = tooltips.indexOf(tippyInstance);
            if (index > -1) {
                tooltips.splice(index, 1);
            }
        }
        if (recursive) {
            for (const child of element.childNodes) {
                destroy(<Element>child, recursive);
            }
        }
    }

    export function destroyAll() {
        while (tooltips.length > 0) {
            const tooltip = tooltips.pop();
            if (tooltip != null) {
                tooltip.destroy();
            }
        }
    }

    export function disableNestedTooltips(element: Element): Element[] {
        const childTooltips: Element[] = [];
        for (const child of element.childNodes) {
            const childElement = <Element>child;
            let tippyInstance = getTippyInstance(childElement);
            if (tippyInstance != null) {
                tippyInstance.disable();
                childTooltips.push(childElement);
            }
            childTooltips.push(...disableNestedTooltips(childElement));
        }
        return childTooltips;
    }

    export function getTippyInstance(element: Element): Instance | null {
        if ((<any>element)._tippy) {
            return (<any>element)._tippy;
        }
        return null;
    }

    export function setTooltipContentUntilHidden(element: Element, content: Content) {
        const tippy = Tooltips.getTippyInstance(element);
        if (tippy != null) {
            const prevContent = tippy.props.content;
            tippy.hide();
            tippy.setContent(content);
            tippy.setProps({
                onHidden(instance: Instance) {
                    instance.setContent(prevContent);
                }
            });
            tippy.show();
        }
    }
}

tippy.setDefaultProps({
    delay: 150,
    duration: 150,
    arrow: "<div class=\"v-popper__arrow-outer\"></div><div class=\"v-popper__arrow-inner\"></div>",
    offset: [0, 5],
    maxWidth: "none",
    onCreate(instance: Instance) {
        instance.popper.classList.add("ts-disable-pointer-events", "v-popper__popper");
        instance.popper.setAttribute("data-popper-placement", "top");
        const box = instance.popper.querySelector("div.tippy-box");
        if (box != null && !box.classList.contains("v-popper__wrapper")) {
            box.classList.add("v-popper__wrapper");
        }
        const content = instance.popper.querySelector("div.tippy-content");
        if (content != null && !content.classList.contains("v-popper__inner")) {
            content.classList.add("v-popper__inner");
        }
        const arrow = instance.popper.querySelector("div.tippy-svg-arrow");
        if (arrow != null && !arrow.classList.contains("v-popper__arrow-container")) {
            arrow.classList.add("v-popper__arrow-container");
        }
    }
});
