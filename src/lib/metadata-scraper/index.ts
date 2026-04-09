/**
 * MIT License
 *
 * Copyright (c) 2021 Maximilian Schiller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {metaDataRules} from './rules'
import {Context, MetaData, Options, RuleSet} from './types'

export * from "./types";

const defaultOptions = {
	maxRedirects: 5,
	ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
	lang: "*",
	timeout: 10000,
	forceImageHttps: true,
	customRules: {},
};

const runRule = function (ruleSet: RuleSet, doc: Document, context: Context) {
	let maxScore = 0;
	let value;
	for (let currRule = 0; currRule < ruleSet.rules.length; currRule++) {
		const [query, handler] = ruleSet.rules[currRule];
		const elements = Array.from(doc.querySelectorAll(query));
		if (elements.length) {
			for (const element of elements) {
				let score = ruleSet.rules.length - currRule;
				if (ruleSet.scorer) {
					const newScore = ruleSet.scorer(element, score);

					if (newScore) {
						score = newScore;
					}
				}
				if (score > maxScore) {
					maxScore = score;
					value = handler(element);
				}
			}
		}
	}
	if (value) {
		if (ruleSet.processor) {
			value = ruleSet.processor(value, context);
		}
		return value;
	}
	if ((!value || value.length < 1) && ruleSet.defaultValue) {
		return ruleSet.defaultValue(context);
	}
	return undefined;
}

const getMetaData = async function (input: string | Partial<Options>, inputOptions: Partial<Options> = {}) {
	let url;
	if (typeof input === "object") {
		inputOptions = input
		url = input.url || "";
	} else {
		url = input;
	}
	const options = Object.assign({}, defaultOptions, inputOptions);
	const rules: Record<string, RuleSet> = {...metaDataRules};
	Object.keys(options.customRules).forEach((key: string) => {
		rules[key] = {
			rules: [...metaDataRules[key].rules, ...options.customRules[key].rules],
			defaultValue: options.customRules[key].defaultValue || metaDataRules[key].defaultValue,
			processor: options.customRules[key].processor || metaDataRules[key].processor,
		}
	});
	let html: string | null;
	if (!options.html) {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"User-Agent": options.ua,
				"Accept": "*/*",
				"Accept-Language": options.lang,
				"Origin": url.toString(),
			},
			signal: AbortSignal.timeout(5000),
			...(options.maxRedirects === 0 ? {followRedirect: false} : {maxRedirects: options.maxRedirects}),
		})
		html = await response.text();
	} else {
		html = options.html;
	}
	const metadata: MetaData = {};
	const context: Context = {
		url,
		options,
	};
	const doc = new DOMParser().parseFromString(html, "text/html");
	Object.keys(rules).map((key: string) => {
		const ruleSet = rules[key];
		metadata[key] = runRule(ruleSet, doc, context) || undefined;
	})
	return metadata;
}

export default getMetaData;
