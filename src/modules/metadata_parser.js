/*
MIT License

Copyright (c) 2021 Maximilian Schiller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

https://github.com/BetaHuhn/metadata-scraper
*/ 

const parseMetadata = (function() {
	const metaDataRules = {
		title: {
			rules: [
				[ 'meta[property="og:title"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:title"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="twitter:title"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="twitter:title"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="parsely-title"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="parsely-title"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="sailthru.title"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="sailthru.title"][content]', element => element.getAttribute('content') ],
				[ 'title', element => element.text ]
			]
		},
		description: {
			rules: [
				[ 'meta[property="og:description"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:description"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="description" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="description" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="sailthru.description"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="sailthru.description"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="twitter:description"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="twitter:description"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="summary" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="summary" i][content]', element => element.getAttribute('content') ]
			]
		},
		language: {
			rules: [
				[ 'html[lang]', element => element.getAttribute('lang') ],
				[ 'meta[property="language" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="language" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="og:locale"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:locale"][content]', element => element.getAttribute('content') ]
			],
			processor: language => language.split('-')[0]
		},
		type: {
			rules: [
				[ 'meta[property="og:type"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:type"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="parsely-type"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="parsely-type"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="medium"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="medium"][content]', element => element.getAttribute('content') ]
			]
		},
		url: {
			rules: [
				[ 'meta[property="og:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="al:web:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="al:web:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="parsely-link"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="parsely-link"][content]', element => element.getAttribute('content') ],
				[ 'a.amp-canurl', element => element.getAttribute('href') ],
				[ 'link[rel="canonical"][href]', element => element.getAttribute('href') ]
			],
			defaultValue: context => context.url,
			processor: (url, context) => makeUrlAbsolute(context.url, url)
		},
		provider: {
			rules: [
				[ 'meta[property="og:site_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:site_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="publisher" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="publisher" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="application-name" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="application-name" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="al:android:app_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="al:android:app_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="al:iphone:app_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="al:iphone:app_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="al:ipad:app_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="al:ipad:app_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="al:ios:app_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="al:ios:app_name"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="twitter:app:name:iphone"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="twitter:app:name:iphone"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="twitter:app:name:ipad"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="twitter:app:name:ipad"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="twitter:app:name:googleplay"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="twitter:app:name:googleplay"][content]', element => element.getAttribute('content') ]
			],
			defaultValue: context => getProvider(parseUrl(context.url))
		},
		keywords: {
			rules: [
				[ 'meta[property="keywords" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="keywords" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="parsely-tags"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="parsely-tags"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="sailthru.tags"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="sailthru.tags"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="article:tag" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="article:tag" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="book:tag" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="book:tag" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="topic" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="topic" i][content]', element => element.getAttribute('content') ]
			],
			processor: keywords => keywords.split(',').map(keyword => keyword.trim())
		},
		section: {
			rules: [
				[ 'meta[property="article:section"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="article:section"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="category"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="category"][content]', element => element.getAttribute('content') ]
			]
		},
		author: {
			rules: [
				[ 'meta[property="author" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="author" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="article:author"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="article:author"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="book:author"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="book:author"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="parsely-author"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="parsely-author"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="sailthru.author"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="sailthru.author"][content]', element => element.getAttribute('content') ],
				[ 'a[class*="author" i]', element => element.text ],
				[ '[rel="author"]', element => element.text ],
				[ 'meta[property="twitter:creator"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="twitter:creator"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="profile:username"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="profile:username"][content]', element => element.getAttribute('content') ]
			]
		},
		published: {
			rules: [
				[ 'meta[property="article:published_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="article:published_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="published_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="published_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="parsely-pub-date"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="parsely-pub-date"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="sailthru.date"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="sailthru.date"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="date" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="date" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="release_date" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="release_date" i][content]', element => element.getAttribute('content') ],
				[ 'time[datetime]', element => element.getAttribute('datetime') ],
				[ 'time[datetime][pubdate]', element => element.getAttribute('datetime') ]
			],
			processor: value => Date.parse(value.toString()) ? new Date(value.toString()).toISOString() : undefined
		},
		modified: {
			rules: [
				[ 'meta[property="og:updated_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:updated_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="article:modified_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="article:modified_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="updated_time" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="updated_time" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="modified_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="modified_time"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="revised"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="revised"][content]', element => element.getAttribute('content') ]
			],
			processor: value => Date.parse(value.toString()) ? new Date(value.toString()).toISOString() : undefined
		},
		robots: {
			rules: [
				[ 'meta[property="robots" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="robots" i][content]', element => element.getAttribute('content') ]
			],
			processor: keywords => keywords.split(',').map(keyword => keyword.trim())
		},
		copyright: {
			rules: [
				[ 'meta[property="copyright" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="copyright" i][content]', element => element.getAttribute('content') ]
			]
		},
		email: {
			rules: [
				[ 'meta[property="email" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="email" i][content]', element => element.getAttribute('content') ],
				[ 'meta[property="reply-to" i][content]', element => element.getAttribute('content') ],
				[ 'meta[name="reply-to" i][content]', element => element.getAttribute('content') ]
			]
		},
		twitter: {
			rules: [
				[ 'meta[property="twitter:site"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="twitter:site"][content]', element => element.getAttribute('content') ]
			]
		},
		facebook: {
			rules: [
				[ 'meta[property="fb:pages"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="fb:pages"][content]', element => element.getAttribute('content') ]
			]
		},
		image: {
			rules: [
				[ 'meta[property="og:image:secure_url"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:image:secure_url"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="og:image:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:image:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="og:image"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:image"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="twitter:image"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="twitter:image"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="twitter:image:src"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="twitter:image:src"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="thumbnail"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="thumbnail"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="parsely-image-url"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="parsely-image-url"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="sailthru.image.full"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="sailthru.image.full"][content]', element => element.getAttribute('content') ]
			],
			processor: (imageUrl, context) => context.options.forceImageHttps === true ? makeUrlSecure(makeUrlAbsolute(context.url, imageUrl)) : makeUrlAbsolute(context.url, imageUrl)
		},
		icon: {
			rules: [
				[ 'link[rel="apple-touch-icon"][href]', element => element.getAttribute('href') ],
				[ 'link[rel="apple-touch-icon-precomposed"][href]', element => element.getAttribute('href') ],
				[ 'link[rel="icon" i][href]', element => element.getAttribute('href') ],
				[ 'link[rel="fluid-icon"][href]', element => element.getAttribute('href') ],
				[ 'link[rel="shortcut icon"][href]', element => element.getAttribute('href') ],
				[ 'link[rel="Shortcut Icon"][href]', element => element.getAttribute('href') ],
				[ 'link[rel="mask-icon"][href]', element => element.getAttribute('href') ]
			],
			scorer: element => {
				const sizes = element.getAttribute('sizes')
				if(sizes) {
					const sizeMatches = sizes.match(/\d+/g)
					if(sizeMatches) {
						const parsed = parseInt(sizeMatches[0])
						if(!isNaN(parsed)) {
							return parsed
						}
					}
				}
			},
			defaultValue: context => makeUrlAbsolute(context.url, '/favicon.ico'),
			processor: (iconUrl, context) => context.options.forceImageHttps === true ? makeUrlSecure(makeUrlAbsolute(context.url, iconUrl)) : makeUrlAbsolute(context.url, iconUrl)
		},
		video: {
			rules: [
				[ 'meta[property="og:video:secure_url"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:video:secure_url"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="og:video:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:video:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="og:video"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:video"][content]', element => element.getAttribute('content') ]
			],
			processor: (imageUrl, context) => context.options.forceImageHttps === true ? makeUrlSecure(makeUrlAbsolute(context.url, imageUrl)) : makeUrlAbsolute(context.url, imageUrl)
		},
		audio: {
			rules: [
				[ 'meta[property="og:audio:secure_url"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:audio:secure_url"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="og:audio:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:audio:url"][content]', element => element.getAttribute('content') ],
				[ 'meta[property="og:audio"][content]', element => element.getAttribute('content') ],
				[ 'meta[name="og:audio"][content]', element => element.getAttribute('content') ]
			],
			processor: (imageUrl, context) => context.options.forceImageHttps === true ? makeUrlSecure(makeUrlAbsolute(context.url, imageUrl)) : makeUrlAbsolute(context.url, imageUrl)
		}
	};
	
	const defaultOptions = {
		forceImageHttps: true,
		customRules: {}
	};
	
	const runRule = function(ruleSet, doc, context) {
		let maxScore = 0;
		let value;
		for(let currRule = 0; currRule < ruleSet.rules.length; currRule++) {
			const [query, handler] = ruleSet.rules[currRule];
			const elements = Array.from(doc.querySelectorAll(query));
			if(elements.length) {
				for(const element of elements) {
					let score = ruleSet.rules.length - currRule;
					if(ruleSet.scorer) {
						const newScore = ruleSet.scorer(element, score);
						if(newScore) {
							score = newScore;
						}
					}
					if(score > maxScore) {
						maxScore = score;
						value = handler(element);
					}
				}
			}
		}
		if(value) {
			if(ruleSet.processor) {
				value = ruleSet.processor(value, context);
			}
			return value;
		}
		if((!value || value.length < 1) && ruleSet.defaultValue) {
			return ruleSet.defaultValue(context);
		}
		return undefined;
	};
	
	function parseMetadata(url, html, inputOptions = {}) {
		const metadata = {};
		const options = Object.assign({}, defaultOptions, inputOptions);
		const rules = { ...metaDataRules };
		const context = {
			url,
			options
		};
		const doc = new DOMParser().parseFromString(html, "text/html").documentElement;
		Object.keys(rules).map(key => {
			const ruleSet = rules[key];
			metadata[key] = runRule(ruleSet, doc, context) || undefined;
		});
		return metadata;
	}
	
	function makeUrlAbsolute(base, relative) {
		try {
			return new URL(relative).href;
		} catch(e1) {
			try {
				return new URL(relative, base).href;
			} catch(e2) {
				return relative;
			}
		}
	}
	
	function makeUrlSecure(url) {
		return url.replace(/^http:/, 'https:');
	}
	
	function parseUrl(url) {
		try {
			return new URL(url).href;
		} catch(e) {
			return '';
		}
	}
	
	function getProvider(host) {
		return host.replace(/www[a-zA-Z0-9]*\./, '')
			.replace('.co.', '.')
			.split('.')
			.slice(0, -1)
			.join(' ');
	}
	
	return parseMetadata;
})();