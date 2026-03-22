import * as esbuild from 'esbuild'
import copyStaticFiles from "esbuild-copy-static-files";

const debug = process.env.DEBUG === "true";

esbuild.build({
	entryPoints: ['build/BetterChat.js'],
	bundle: true,
	outfile: 'bundle/betterchat/index.js',
	platform: "browser",
	target: "chrome100",
	format: "esm",
	allowOverwrite: true,
	minifySyntax: !debug,
	minifyWhitespace: !debug,
	minifyIdentifiers: !debug,
	charset: "utf8",
	assetNames: "[name]",
	sourcemap: debug,
	plugins: [
		copyStaticFiles({
			src: 'static',
			dest: 'bundle',
		}),
	],
}).catch(console.error);
