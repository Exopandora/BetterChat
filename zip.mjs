import {zip} from "zip-a-folder";
import fs from "fs";

const inputDir = "build/bundle";
const outputDir = "build/zip";

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir);
}

const addonJson = JSON.parse(fs.readFileSync(`${inputDir}/addon.json`, "utf8"));
const addonId = addonJson.id;
const addonVersion = addonJson.version;

await zip(inputDir, `${outputDir}/${addonId}-${addonVersion}.zip`);
