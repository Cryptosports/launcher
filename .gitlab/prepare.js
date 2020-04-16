const StreamZip = require("node-stream-zip");
const path = require("path");
const fs = require("fs");

const ENV = {
	CI_COMMIT_TAG: process.env.CI_COMMIT_TAG,
};

if (Object.values(ENV).includes(undefined)) {
	for (const key of Object.keys(ENV)) {
		if (ENV[key] == undefined) console.log("Can't find " + key);
	}
	process.exit(1);
}

function updateVersion() {
	const packagePath = path.resolve("../package.json");
	const package = JSON.parse(fs.readFileSync(packagePath, "utf8"));
	package.version = ENV.CI_COMMIT_TAG;

	fs.writeFileSync(packagePath, JSON.stringify(package, null, 4));

	console.log(
		"Updated version to " + package.version + " in: " + packagePath,
	);
}

async function patchInterface() {
	return new Promise(resolve => {
		const interfacePath = path.resolve(__dirname, "../interface");
		console.log("Patching interface: " + interfacePath);

		const zip = new StreamZip({
			file: path.resolve(__dirname, "VC_redist.x64.zip"),
		});

		zip.on("ready", () => {
			if (!fs.existsSync(interfacePath)) fs.mkdirSync(interfacePath);

			zip.extract(null, interfacePath, error => {
				if (error) throw new Error(error);

				const fileNames = Object.keys(zip.entries());
				console.log(
					fileNames.map(name => "Extracted: " + name).join("\n"),
				);

				zip.close();

				console.log("Finished patching!");
				resolve();
			});
		});
	});
}

(async () => {
	try {
		updateVersion();
		console.log("");
		await patchInterface();
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
})();
