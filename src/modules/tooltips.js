const tooltipManager = (function() {
	const tooltips = []
	
	function createTooltip(element, text) {
		tooltips.push(tippy(element, {content: text}));
		return suppressChildTooltips(element);
	}
	
	function destroyTooltip(element) {
		if(element._tippy) {
			element._tippy.destroy();
		}
		const index = tooltips.indexOf(element._tippy);
		if(index > -1) {
			array.splice(index, 1);
		}
	}
	
	function destroyAll() {
		while(tooltips.length > 0) {
			const tooltip = tooltips.pop();
			if(tooltip._tippy) {
				tooltip.destroy();
			}
		}
	}
	
	function suppressChildTooltips(element) {
		const childTooltips = [];
		for(const child of element.childNodes) {
			if(child._tippy) {
				child._tippy.disable();
				childTooltips.push(child);
			}
			childTooltips.push(...suppressChildTooltips(child));
		}
		return childTooltips;
	}
	
	return {
		createTooltip,
		destroyTooltip,
		destroyAll,
		suppressChildTooltips
	}
})();

const tippyDefaultProps = {
	delay: 150,
	duration: 150,
	arrow: "<div class=\"v-popper__arrow-outer\"></div><div class=\"v-popper__arrow-inner\"></div>",
	offset: [0, 5],
	maxWidth: "none",
	onCreate(instance) {
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
