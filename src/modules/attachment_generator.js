const attachmentGenerator = (function() {
	const attachmentCache = new Map();
	const twitterEmbedTheme = "dark";
	const imagePreviewWidthPct = 0.65;
	const imagePreviewHeightPct = 0.65;
	
	class Attachment {
		constructor(node) {
			this.node = node;
		}
		
		newInstance() {
			return this.node.cloneNode(true);
		}
	}
	
	class VideoAttachment extends Attachment {
		constructor(node) {
			super(node);
		}
		
		newInstance() {
			const container = document.createElement("div");
			const element = document.createElement("video");
			container.classList.add("ts-attachment-video-content");
			element.style.height = "100%";
			element.style.width = "100%";
			element.setAttribute("controls", "");
			element.src = this.node.src;
			container.appendChild(element);
			return container;
		}
	}
	
	class AudioAttachment extends Attachment {
		constructor(node) {
			super(node);
		}
		
		newInstance() {
			const container = document.createElement("div");
			const element = document.createElement("audio");
			element.setAttribute("controls", "");
			element.src = this.node.src;
			container.appendChild(element);
			return container;
		}
	}
	
	class TwitterAttachment extends Attachment {
		constructor(node) {
			super(node);
		}
		
		newInstance() {
			const node = super.newInstance();
			twttr.widgets.load(node.firstChild);
			return node;
		}
	}
	
	class ImageAttachment extends Attachment {
		constructor(node, url, naturalWidth, naturalHeight) {
			super(node);
			this.url = url;
			this.naturalWidth = naturalWidth;
			this.naturalHeight = naturalHeight;
		}
		
		newInstance() {
			const node = super.newInstance();
			node.onclick = event => {
				showImagePreview(this.url, this.naturalWidth, this.naturalHeight);
				event.stopPropagation();
				event.preventDefault();
			};
			return node;
		}
	}
	
	class MultimediaAttachment extends Attachment {
		constructor(node) {
			super(node);
		}
		
		newInstance() {
			const container = document.createElement("div");
			var element;
			if(this.node.videoWidth == 0 && this.node.videoHeight == 0) {
				element = document.createElement("audio");
			} else {
				element = document.createElement("video");
				container.classList.add("ts-attachment-video-content");
				element.style.height = "100%";
				element.style.width = "100%";
			}
			element.setAttribute("controls", "");
			element.src = this.node.src;
			container.appendChild(element);
			return container;
		}
	}
	
	class GenericAttachment extends Attachment {
		constructor(node, url) {
			super(node);
			this.url = url;
		}
		
		newInstance() {
			const node = this.node.cloneNode(true);
			const title = node.querySelector("div.betterchat-attachment-title-container a");
			tooltipManager.createTooltip(title, "Links to: " + this.url);
			const img = node.querySelector("img.betterchat-attachment-image");
			if(img != null) {
				img.onclick = event => {
					showImagePreview(img.src, img.naturalWidth, img.naturalHeight);
					event.stopPropagation();
					event.preventDefault();
				};
			}
			return node;
		}
	}
	
	function createImageEmbed(url, resolve, reject) {
		const img = document.createElement("img");
		img.onload = () => {
			img.classList.add("display");
			img.style.cursor = "pointer";
			const backing = document.createElement("img");
			backing.src = url;
			backing.classList.add("backing");
			const container = document.createElement("div");
			container.classList.add("ts-chat-message-attachment-image");
			container.appendChild(backing);
			container.appendChild(img);
			const integration = document.createElement("div");
			integration.classList.add("ts-chat-message-attachment-integration");
			integration.appendChild(container);
			resolve(new ImageAttachment(integration, url, img.naturalWidth, img.naturalHeight));
		}
		img.onerror = () => reject();
		img.src = url;
	}
	
	function createVideoEmbed(url, resolve, reject) {
		const video = document.createElement("video");
		video.oncanplay = () => resolve(new VideoAttachment(video));
		video.onerror = () => reject();
		video.src = url;
	}
	
	function createAudioEmbed(url, resolve, reject) {
		const audio = document.createElement("audio");
		audio.oncanplay = () => resolve(new AudioAttachment(audio));
		audio.onerror = () => reject();
		audio.src = url;
	}
	
	function createMultimediaEmbed(url, resolve, reject) {
		const video = document.createElement("video");
		video.oncanplay = () => resolve(new MultimediaAttachment(video));
		video.onerror = () => reject();
		video.src = url;
	}
	
	async function createTwitterEmbed(url) {
		const match = url.match(/^(\S+?)\/photo\/\d+$/);
		if(match != null) {
			url = match[1];
		}
		const tweet = await fetch("https://publish.twitter.com/oembed?theme=" + twitterEmbedTheme +"&dnt=true&omit_script=true&url=" + encodeURIComponent(url));
		const json = await tweet.json();
		const container = document.createElement("div");
		container.innerHTML = json.html;
		container.firstChild.style.display = "none";
		container.classList.add("ts-chat-message-attachment-integration");
		container.style.marginTop = "-10px";
		container.style.marginBottom = "-10px";
		return new TwitterAttachment(container);
	}
	
	function createGenericEmbed(url, html, resolve, reject) {
		const data = parseMetadata(url, html);
		const attachmentContainer = document.createElement("div");
		attachmentContainer.classList.add("betterchat-attachment-container");
		const attachmentHeader = document.createElement("div");
		attachmentHeader.classList.add("betterchat-attachment-header");
		if(data.icon) {
			const faviconContainer = document.createElement("div");
			faviconContainer.classList.add("betterchat-attachment-favicon-container");
			const favicon = document.createElement("img");
			favicon.classList.add("betterchat-attachment-favicon");
			favicon.src = data.icon;
			faviconContainer.appendChild(favicon);
			attachmentHeader.appendChild(faviconContainer);
		}
		const titleContainer = document.createElement("div");
		titleContainer.classList.add("betterchat-attachment-title-container");
		const title = document.createElement("a");
		title.href = url;
		title.target = "_blank";
		title.textContent = truncate(data.title || url, 150);
		titleContainer.appendChild(title);
		attachmentHeader.appendChild(titleContainer);
		const attachmentContentContainer = document.createElement("div");
		attachmentContentContainer.classList.add("betterchat-attachment-content-container");
		const hasDescription = data.description && data.description.trim() != "";
		if(data.image) {
			const imageContainer = document.createElement("div");
			imageContainer.classList.add("betterchat-attachment-image-container");
			if(hasDescription) {
				imageContainer.classList.add("betterchat-attachment-image-container-description");
			}
			const imageLink = document.createElement("a");
			imageLink.href = url;
			imageLink.target = "_blank";
			imageLink.style.display = "inline-block";
			const image = document.createElement("img");
			image.classList.add("betterchat-attachment-image");
			image.src = data.image;
			imageLink.appendChild(image);
			imageContainer.appendChild(imageLink);
			attachmentContentContainer.appendChild(imageContainer);
		}
		if(hasDescription) {
			const description = document.createElement("div");
			description.classList.add("betterchat-attachment-description")
			description.textContent = truncate(data.description, data.image ? 200 : 500);
			attachmentContentContainer.appendChild(description);
		}
		attachmentContainer.appendChild(attachmentHeader);
		attachmentContainer.appendChild(attachmentContentContainer);
		resolve(new GenericAttachment(attachmentContainer, url));
	}
	
	function createEmbed(url) {
		return new Promise((resolve, reject) => {
			fetch(url.href, {
				method: "GET",
				headers: {
					"User-Agent": navigator.userAgent,
					"Accept": "*/*",
					'Accept-Language': "*",
					'Origin': url
				},
				signal: AbortSignal.timeout(5000)
			}).then(response => {
				if(response.status == 200 && response.headers.has("Content-Type")) {
					const contentType = response.headers.get("Content-Type");
					if(contentType.startsWith("image/")) {
						createImageEmbed(url.href, resolve, reject);
						return;
					} else if(contentType.startsWith("video/")) {
						createVideoEmbed(url.href, resolve, reject);
						return;
					} else if(contentType.startsWith("audio/")) {
						createAudioEmbed(url.href, resolve, reject);
						return;
					} else if(contentType == "application/ogg") {
						createMultimediaEmbed(url.href, resolve, reject);
						return;
					} else if(contentType.startsWith("text/html") || contentType.startsWith("application/xhtml+xml") || contentType.startsWith("application/xml")) {
						response.text().then(text => createGenericEmbed(url.href, text, resolve, reject));
						return;
					}
				}
				reject();
			}).catch(e => reject());
		});
	}
	
	async function createAttachments(links) {
		const promises = new Map();
		for(const link of links) {
			if(link.match(/^https?:\/\/localhost/g) != null) {
				continue;
			} else if(attachmentCache.has(link)) {
				promises.set(link, attachmentCache.get(link));
				continue;
			} else if(promises.has(link)) {
				continue;
			}
			try {
				const url = new URL(link);
				if(url.protocol != "https:" && url.protocol != "http:" || url.hostname == "youtube.com" || url.hostname == "www.youtube.com" || url.hostname == "youtu.be" || url.hostname == "giphy.com") {
					continue;
				} else if(url.hostname == "twitter.com" && !url.pathname.startsWith("/home") && !url.pathname.startsWith("/explore") && !url.pathname.startsWith("/notifications") && !url.pathname.startsWith("/messages") && (!url.pathname.startsWith("/i/") || url.pathname.startsWith("/i/status"))) {
					promises.set(link, createTwitterEmbed(url.href));
				} else {
					promises.set(link, createEmbed(url));
				}
			} catch(e) {
				continue;
			}
		}
		await Promise.allSettled(promises.values());
		const fulfilled = [];
		for(const [link, promise] of promises.entries()) {
			if(!attachmentCache.has(link)) {
				attachmentCache.set(link, promise);
			}
			await promise.then(attachment => fulfilled.push(attachment.newInstance()), () => {});
		}
		return fulfilled;
	}
	
	function resizeImagePreview(previewImg, naturalWidth, naturalHeight) {
		const maxPreviewWidth = document.body.clientWidth * imagePreviewWidthPct;
		const maxPreviewHeight = document.body.clientHeight * imagePreviewHeightPct;
		var width = naturalWidth;
		var height = naturalHeight;
		if(width > maxPreviewWidth) {
			height *= maxPreviewWidth / width;
			width = maxPreviewWidth;
		}
		if(height > maxPreviewHeight) {
			width *= maxPreviewHeight / height;
			height = maxPreviewHeight;
		}
		if(width < maxPreviewWidth && height < maxPreviewHeight) {
			if(maxPreviewWidth - width < maxPreviewHeight - height) {
				height *= maxPreviewWidth / width;
				width = maxPreviewWidth;
			} else {
				width *= maxPreviewHeight / height;
				height = maxPreviewHeight;
			}
		}
		previewImg.width = width;
		previewImg.height = height;
	}
	
	function showImagePreview(url, naturalWidth, naturalHeight) {
		const img = document.createElement("img");
		img.classList.add("betterchat-image-preview-image");
		img.src = url;
		img.onclick = event => {
			event.stopPropagation();
			event.preventDefault();
		};
		resizeImagePreview(img, naturalWidth, naturalHeight);
		const link = document.createElement("a");
		link.classList.add("betterchat-image-preview-link");
		link.innerText = "View original";
		link.style.cursor = "pointer";
		link.onclick = event => {
			window.open(url);
			event.stopPropagation();
			event.preventDefault();
		};
		const wrapper = document.createElement("div");
		wrapper.appendChild(img);
		wrapper.appendChild(link);
		const container = document.createElement("div");
		container.classList.add("betterchat-image-preview");
		container.appendChild(wrapper);
		container.onclick = event => {
			container.remove();
			window.removeEventListener("resize", onWindowResize);
			event.stopPropagation();
			event.preventDefault();
		};
		document.body.appendChild(container);
		window.addEventListener("resize", onWindowResize);
	}
	
	function onWindowResize() {
		const previewImg = document.querySelector("img.betterchat-image-preview-img");
		if(previewImg != null) {
			resizeImagePreview(previewImg, previewImg.naturalWidth, previewImg.naturalHeight);
		}
	}
	
	function truncate(string, size) {
		if(string.length > size) {
			return string.substring(0, Math.max(0, size - 3)) + "...";
		}
		return string;
	}
	
	return {
		createAttachments
	};
})();