(function() {
	class Settings {
		constructor() {
			this.defaults = {};
			this.configureDefaults();
			this.userPreferences = {...this.defaults};
		}
		
		configName() {
			return "betterchat";
		}
		
		configureDefaults() {
			this.defaults.enabled = true;
			this.defaults.chatStyling = true;
			this.defaults.embeds = true;
		}
		
		saveConfiguration() {
			tsclient_internal.saveJsonBlob(this.configName(), JSON.stringify(this.userPreferences));
		}
		
		populateSettings(callback) {
			tsclient_internal.getJsonBlob(this.configName(), (err, json) => {
				if(0 === err && json.length > 0) {
					this.userPreferences = JSON.parse(json);
					for(const key in this.defaults) {
						if(!(key in this.userPreferences)) {
							this.userPreferences[key] = this.defaults[key];
						}
					}
				}
				callback();
			});
		}
		
		getValueForKey(key) {
			return this.userPreferences[key];
		}
		
		setValueForKey(key, value) {
			this.userPreferences[key] = value;
			this.saveConfiguration();
		}
	}
	
	const settings = new Settings();
	
	function onMessageHeightChanged(node) {
		const virtualListItem = node.closest("div.tsv-virtual-list-item");
		if(virtualListItem != null && virtualListItem.__vue__) {
			virtualListItem.__vue__.onItemChanged();
		}
	}
	
	function modifyMessageNode(node) {
		if(node.classList.contains("ts-chat-message-system-body-contents")) {
			return;
		}
		for(const childNode of node.childNodes) {
			if(childNode.tagName == "SPAN" && childNode.classList.contains("ts-parsed-text-content-emoji")) {
				return;
			}
		}
		if(settings.getValueForKey("chatStyling")) {
			const [message, emojis, bbSectionsMap] = messageParser.parseMessage(node);
			const htmlElements = messageGenerator.generateHtml(message, emojis, bbSectionsMap);
			while(node.firstChild) {
				node.removeChild(node.lastChild);
			}
			for(const htmlElement of htmlElements) {
				node.appendChild(htmlElement);
			}
		}
		if(settings.getValueForKey("embeds") && !node.classList.contains("ts-reply-original") && !node.classList.contains("ts-reply-shortened")) {
			const links = Array.from(node.parentElement.querySelectorAll("a")).map(link => link.href);
			attachmentGenerator.createAttachments(links).then(attachments => {
				if(attachments.length > 0) {
					const renderedMessage = node.closest("div.ts-rendered-message");
					var container = renderedMessage.querySelector("div.ts-chat-message-attachment-container");
					if(container == null) {
						container = document.createElement("div");
						container.classList.add("ts-chat-message-attachment-container", "ts-chat-message-attachments", "ts-timestamp-margin-left");
						const chatRoomEventBody = renderedMessage.querySelector("div.ts-chat-room-event-body");
						if(chatRoomEventBody != null) {
							const tsvflex = document.createElement("div");
							tsvflex.classList.add("tsv-flex");
							tsvflex.appendChild(container);
							chatRoomEventBody.appendChild(tsvflex);
						} else {
							node.parentNode.insertBefore(container, node.nextSibling);
						}
					}
					for(const attachment of attachments) {
						const inner = document.createElement("div");
						inner.classList.add("ts-chat-message-attachment-inner");
						inner.appendChild(attachment);
						const outer = document.createElement("div");
						outer.classList.add("ts-chat-message-attachment");
						outer.appendChild(inner);
						container.appendChild(outer);
					}
				}
			}).then(() => {
				onMessageHeightChanged(node);
			});
		} else {
			onMessageHeightChanged(node);
		}
		node.dataset.parsed = true;
	}
	
	function isModifiedMessageNode(node) {
		return node.dataset.parsed;
	}
	
	function createSettingsCategoryHeader(name) {
		const title = document.createElement("div");
		title.classList.add("title");
		title.innerText = name;
		const header = document.createElement("div");
		header.classList.add("ts-widget-section-header");
		header.appendChild(title);
		return header;
	}
	
	function createSettingsContentWrapper() {
		const content = document.createElement("div");
		content.classList.add("ts-card", "ts-widget", "full");
		return content;
	}
	
	function createToggleSetting(title, description, configKey) {
		const input = document.createElement("input");
		input.type = "checkbox";
		const toggleInner = document.createElement("div");
		const updateToggleInner = enabled => {
			if(enabled) {
				toggleInner.classList.add("checked");
			} else if(toggleInner.classList.contains("checked")) {
				toggleInner.classList.remove("checked");
			}
		};
		updateToggleInner(settings.getValueForKey(configKey));
		toggleInner.classList.add("ts-toggle-inner", "visible");
		toggleInner.appendChild(input);
		const toggle = document.createElement("div");
		toggle.classList.add("ts-toggle");
		toggle.appendChild(toggleInner);
		const titleLabel = document.createElement("label");
		titleLabel.innerText = title;
		const toggleWrapper = document.createElement("div");
		toggleWrapper.classList.add("ts-toggle-wrapper", "ts-flex", "row");
		toggleWrapper.onclick = () => {
			const enabled = !settings.getValueForKey(configKey);
			settings.setValueForKey(configKey, enabled);
			updateToggleInner(enabled);
		};
		toggleWrapper.appendChild(titleLabel);
		toggleWrapper.appendChild(toggle);
		const subtitle = document.createElement("p");
		subtitle.classList.add("ts-card-subtitle");
		subtitle.innerText = description;
		const container = document.createElement("div");
		container.classList.add("ts-card-setting-container");
		container.appendChild(toggleWrapper);
		container.appendChild(subtitle);
		return container;
	}
	
	function appendSettingsToView() {
		const root = document.querySelector("div.ts-appearance-settings div.ts-widget-container");
		if(root == null) {
			return;
		}
		const header = createSettingsCategoryHeader("BetterChat");
		root.appendChild(header);
		const content = createSettingsContentWrapper();
		content.appendChild(createToggleSetting("Enable BetterChat", "Enables advanced chat features", "enabled"));
		content.appendChild(createToggleSetting("Rich Embeds", "Load rich embeds for links in chat messages", "embeds"));
		content.appendChild(createToggleSetting("BBCode support", "Support BBCode styling for chat messages", "chatStyling"));
		root.appendChild(content);
	}
	
	const chatMessageObserver = {
		observer: new MutationObserver((mutations, self) => {
			for(const mutation of mutations) {
				if(mutation.type == "childList" && settings.getValueForKey("enabled")) {
					for(const node of mutation.addedNodes) {
						try {
							if(mutation.target.localName == "span" && mutation.target.classList.contains("ts-chat-message-content") && mutation.target.classList.contains("ts-parsed-text-content") && !isModifiedMessageNode(mutation.target)) {
								modifyMessageNode(mutation.target);
							} else if(node.querySelector) {
								const messages = node.querySelectorAll(".ts-chat-message-content.ts-parsed-text-content");
								for(const message of messages) {
									if(!isModifiedMessageNode(message)) {
										modifyMessageNode(message);
									}
								}
							}
						} catch(e) {
							continue;
						}
					}
				}
			}
		}),
		observe(node) {
			this.observer.observe(node, {
				childList: true,
				attributes: false,
				characterData: false,
				subtree: true
			});
		},
		disconnect() {
			this.observer.disconnect();
		}
	};
	const documentObserver = {
		observer: new MutationObserver((mutations, self) => {
			for(const mutation of mutations) {
				if(mutation.type == "childList") {
					for(const node of mutation.removedNodes) {
						if(node.nodeType == Node.ELEMENT_NODE && node.tagName == "DIV") {
							if((node.classList.contains("ts-chat-container") || node.classList.contains("tsv-activity-detail")) && document.querySelectorAll("div.ts-chat-container").length == 0) {
								chatMessageObserver.disconnect();
								tooltipManager.destroyAll();
							}
						}
					}
					for(const node of mutation.addedNodes) {
						if(node.nodeType == Node.ELEMENT_NODE && node.tagName == "DIV") {
							if(node.classList.contains("tsv-activity-detail")) {
								const chat = node.querySelector("div.ts-chat-container");
								if(chat != null) {
									tooltipManager.destroyAll();
									chatMessageObserver.observe(node);
								}
							} else if(node.classList.contains("ts-chat-container")) {
								tooltipManager.destroyAll();
								chatMessageObserver.observe(node);
							} else if(node.classList.contains("ts-appearance-settings")) {
								const header = document.querySelector("div.tsv-bar.tsv-header-bar-below-tools div.tsv-item-text");
								if(header != null && header.innerText == "Behavior") {
									appendSettingsToView();
								}
							}
						}
					}
				}
			}
		}),
		observe(node) {
			this.observer.observe(node, {
				childList: true,
				attributes: false,
				characterData: false,
				subtree: true
			});
		}
	};
	settings.populateSettings(() => {
		tippy.setDefaultProps(tippyDefaultProps);
		documentObserver.observe(document.body);
	});
})();
