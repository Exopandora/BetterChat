export namespace ModalHelper {
    const observer = new MutationObserver((mutations: MutationRecord[]) => {
        for (const mutation of mutations) {
            if (mutation.type == "childList") {
                for (const node of mutation.removedNodes) {
                    onNodeRemoved(node);
                }
            }
        }
    });

    export function show(modal: HTMLElement) {
        document.querySelector("div.tsv-window")?.classList.add("tsv-has-modal");
        const activity = document.querySelector("div.tsv-view.tsv-activity");
        if (activity != null) {
            activity.appendChild(modal);
            observer.observe(activity, {
                childList: true,
                attributes: false,
                characterData: false,
                subtree: false,
            });
        }
    }

    function onNodeRemoved(node: Node) {
        if (node.nodeType == Node.ELEMENT_NODE && (isActivityDetail(node as Element) || isModal(node as Element))) {
            destroyModal();
        }
    }

    function destroyModal() {
        const modal = document.querySelector("div.tsv-modal-overlay.root");
        if (modal != null) {
            const onDestroy = (modal as any).onDestroy as (() => void) | null;
            if (onDestroy != null) {
                onDestroy();
            }
            modal.remove();
        }
        observer.disconnect();
    }

    function isActivityDetail(node: Element) {
        return node.classList.contains("tsv-activity-detail");
    }

    function isModal(node: Element) {
        return node.classList.contains("tsv-modal-overlay");
    }
}
