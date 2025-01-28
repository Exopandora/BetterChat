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
	
	function removeAttachments(node) {
		for(const attachment of node.querySelectorAll(".ts-chat-message-attachment-container")) {
			attachment.remove();
		}
		onMessageHeightChanged(node);
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
	
	function createSettingsWidgetWrapper() {
		const widgetWrapper = document.createElement("div");
		widgetWrapper.classList.add("ts-widget-wrapper");
		return widgetWrapper;
	}
	
	function createSettingsCardWidget() {
		const content = document.createElement("div");
		content.classList.add("ts-card", "ts-widget", "full");
		return content;
	}
	
	function createToggleSetting(title, description, configKey) {
		const titleSpan = document.createElement("span");
		titleSpan.innerText = title;
		const descriptionP = document.createElement("p");
		descriptionP.classList.add("ts-card-subtitle");
		descriptionP.innerText = description;
		const label = document.createElement("label");
		label.classList.add("tsv-flex-column");
		label.for = "ts-toggle-4";
		label.appendChild(titleSpan);
		label.appendChild(descriptionP);
		const input = document.createElement("input");
		input.type = "checkbox";
		const toggleInner = document.createElement("div");
		toggleInner.classList.add("ts-toggle-inner", "visible");
		toggleInner.appendChild(input);
		const toggle = document.createElement("div");
		toggle.classList.add("ts-toggle", "visible");
		const updateToggle = enabled => {
			if(enabled) {
				toggle.classList.add("checked");
				toggleInner.classList.add("checked");
			} else if(toggle.classList.contains("checked")) {
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
	
	function appendSettingsToView() {
		const root = document.querySelector("div.ts-appearance-settings div.ts-widget-container");
		if(root == null) {
			return;
		}
		const settingsHeader = createSettingsCategoryHeader("BetterChat");
		const cardWidget = createSettingsCardWidget();
		cardWidget.appendChild(createToggleSetting("Enable BetterChat", "Enables advanced chat features", "enabled"));
		cardWidget.appendChild(createToggleSetting("Rich Embeds", "Load rich embeds for links in chat messages", "embeds"));
		cardWidget.appendChild(createToggleSetting("BBCode support", "Support BBCode styling for chat messages", "chatStyling"));
		const widgetWrapper = createSettingsWidgetWrapper();
		widgetWrapper.appendChild(settingsHeader);
		widgetWrapper.appendChild(cardWidget);
		root.appendChild(widgetWrapper);
	}
	
	function findActiveConnection(connections){
		for(const connection of connections) {
			if(connection.activeDetailItem?.chat.isVisible && connection.activeDetailItem?.chat.is_active) {
				return connection;
			}
		}
		return null;
	}
	
	function findOwnMessages(connection, ownID) {
		return connection.activeDetailItem.chat.messages
			.filter(message => message.sender?.uid == ownID && !message.sender.isQueryClient && !message.isSystem)
			.reverse();
	}
	
	function findNextMessage(prevMessage, messages) {
		if(prevMessage == null) {
			return messages[0];
		}
		const index = messages.findIndex(message => message.id == prevMessage.id);
		if(index < 0 || index == messages.length - 1) {
			return null;
		}
		return messages[index + 1];
	}
	
	function findPrevMessage(prevMessage, messages) {
		if(prevMessage == null) {
			return null;
		}
		const index = messages.findIndex(message => message.id == prevMessage.id);
		if(index > 0 && index < messages.length) {
			return messages[index - 1];
		}
		return null;
	}
	
	function setChatInputText(message, chatInputContainer) {
		chatInputContainer.clearContent();
		if(message != null) {
			chatInputContainer.insertUnparsedContent(message.original);
		}
	}
	
	function onChatInputAdded(node) {
		if(!settings.getValueForKey("enabled")) {
			return;
		}
		const appController = document.body.querySelector("#app").__vue__.appController;
		var prevConnectionId = null;
		var prevMessage = null;
		node.addEventListener("keydown", event => {
			const activeConnection = findActiveConnection(appController.connections);
			if(activeConnection == null) {
				return;
			}
			if(prevConnectionId != activeConnection.id) {
				prevConnectionId = activeConnection.id;
				prevMessage = null;
			}
			const ownID = activeConnection.activeDetailItem.chat.identity;
			const chatInputContainer = node.closest("div.ts-chat-input-container")?.__vue__
			const currentText = chatInputContainer?.actualMsg;
			if(event.key === "ArrowUp" && (currentText?.length == 0 || currentText == prevMessage?.original)) {
				const messages = findOwnMessages(activeConnection, ownID);
				const message = findNextMessage(prevMessage, messages);
				if(message != null) {
					setChatInputText(message, chatInputContainer);
					prevMessage = message;
				}
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if(event.key === "ArrowDown" && currentText == prevMessage?.original) {
				const messages = findOwnMessages(activeConnection, ownID);
				const message = findPrevMessage(prevMessage, messages);
				setChatInputText(message, chatInputContainer);
				prevMessage = message;
				event.preventDefault();
				event.stopImmediatePropagation();
			} else if(event.key !== "ArrowUp" && event.key !== "ArrowDown") {
				prevMessage = null;
			}
		});
	}
	
	function onMessageAdded(node) {
		try {
			if(node.querySelector && settings.getValueForKey("enabled")) {
				const messages = node.querySelectorAll(".ts-chat-message-content.ts-parsed-text-content");
				for(const message of messages) {
					if(!isModifiedMessageNode(message)) {
						modifyMessageNode(message);
					}
				}
				if(node?.__vue__?.isRedacted) {
					removeAttachments(node);
				}
			}
		} catch(e) {
			return;
		}
	}
	
	function onMessageRemoved(chatMessageContent, previousSibling) {
		if(isModifiedMessageNode(chatMessageContent)) {
			tooltipManager.destroyTooltip(chatMessageContent, true);
			const renderedMessage = previousSibling.closest(".ts-rendered-message");
			if(renderedMessage != null) {
				removeAttachments(renderedMessage);
			}
		}
	}
	
	const documentObserver = {
		observer: new MutationObserver((mutations, self) => {
			for(const mutation of mutations) {
				if(mutation.type == "childList") {
					for(const node of mutation.removedNodes) {
						if(node.nodeType == Node.ELEMENT_NODE) {
							if(node.tagName == "DIV" && node.classList.contains("tsv-view") && node.classList.contains("tsv-item-view") && node.classList.contains("tsv-view-transparent")) {
								tooltipManager.destroyAll();
							} else if(node.tagName == "SPAN" && node.classList.contains("ts-chat-message-content") && node.classList.contains("ts-parsed-text-content")) {
								onMessageRemoved(node, mutation.previousSibling);
							}
						}
					}
					for(const node of mutation.addedNodes) {
						if(node.nodeType == Node.ELEMENT_NODE && node.tagName == "DIV") {
							if(node.classList.contains("ts-rendered-message")) {
								onMessageAdded(node);
							} else if(node.classList.contains("tsv-virtual-list-item")) {
								const renderedMessage = node.querySelector(".ts-rendered-message");
								if(renderedMessage) {
									onMessageAdded(renderedMessage);
								}
							} else if(node.classList.contains("ts-appearance-settings")) {
								const chatSettingsIcon = document.querySelector("div.tsv-settings div.tsv-settings-categories .tsv-selected svg.tsv-icon-settings-chat");
								if(chatSettingsIcon != null) {
									appendSettingsToView();
								}
							} else if(node.classList.contains("ProseMirror")) {
								onChatInputAdded(node);
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
