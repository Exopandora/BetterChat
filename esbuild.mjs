import * as esbuild from "esbuild"
import copyStaticFiles from "esbuild-copy-static-files";
import {globalExternals} from "@fal-works/esbuild-plugin-global-externals";

const isDebugBuild = process.env.DEBUG === "true";

await esbuild.build({
	entryPoints: ["build/compile/BetterChat.js"],
	bundle: true,
	outfile: "build/bundle/betterchat/index.js",
	platform: "browser",
	target: "chrome143",
	format: "esm",
	allowOverwrite: true,
	minifySyntax: !isDebugBuild,
	minifyWhitespace: !isDebugBuild,
	minifyIdentifiers: !isDebugBuild,
	charset: "utf8",
	assetNames: "[name]",
	sourcemap: isDebugBuild ? "inline" : false,
	plugins: [
		copyStaticFiles({
			src: "static",
			dest: "build/bundle",
		}),
		copyStaticFiles({
			src: "LICENSE",
			dest: "build/bundle/LICENSE",
		}),
		globalExternals({
			"tippy.js": "tippy",
			"katex": "katex",
			"mermaid": "mermaid",
			"svg-pan-zoom": "svgPanZoom",
		}),
	],
});
