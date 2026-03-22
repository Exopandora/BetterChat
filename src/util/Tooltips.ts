declare var tippy: any;

class TooltipManager {
    tooltips: any[] = [];

    createTooltip(element: Node, text: string): Node[] {
        this.tooltips.push(tippy(element, {content: text}));
        return this.suppressChildTooltips(element);
    }

    destroyTooltip(element: Node, recursive: boolean = false) {
        let _tippy = (<any> element)._tippy;
        if(_tippy) {
            _tippy.destroy();
        }
        const index = this.tooltips.indexOf(_tippy);
        if(index > -1) {
            this.tooltips.splice(index, 1);
        }
        if(recursive) {
            for(const child of element.childNodes) {
                this.destroyTooltip(child, recursive);
            }
        }
    }

    destroyAll() {
        while(this.tooltips.length > 0) {
            const tooltip = this.tooltips.pop();
            if(tooltip._tippy) {
                tooltip.destroy();
            }
        }
    }

    suppressChildTooltips(element: Node): Node[] {
        const childTooltips: Node[] = [];
        for(const child of element.childNodes) {
            let _tippy = (<any> element)._tippy;
            if(_tippy) {
                _tippy.disable();
                childTooltips.push(child);
            }
            childTooltips.push(...this.suppressChildTooltips(child));
        }
        return childTooltips;
    }
}

export const tooltipManager = new TooltipManager();

export const tippyDefaultProps = {
    delay: 150,
    duration: 150,
    arrow: "<div class=\"v-popper__arrow-outer\"></div><div class=\"v-popper__arrow-inner\"></div>",
    offset: [0, 5],
    maxWidth: "none",
    onCreate(instance: any) {
        instance.popper.classList.add("ts-disable-pointer-events", "v-popper__popper");
        instance.popper.setAttribute("data-popper-placement", "top");
        const box = instance.popper.querySelector("div.tippy-box");
        if(box != null && !box.classList.contains("v-popper__wrapper")) {
            box.classList.add("v-popper__wrapper");
        }
        const content = instance.popper.querySelector("div.tippy-content");
        if(content != null && !content.classList.contains("v-popper__inner")) {
            content.classList.add("v-popper__inner");
        }
        const arrow = instance.popper.querySelector("div.tippy-svg-arrow");
        if(arrow != null && !arrow.classList.contains("v-popper__arrow-container")) {
            arrow.classList.add("v-popper__arrow-container");
        }
    }
};
