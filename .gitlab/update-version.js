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

(async () => {
	try {
		updateVersion();
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
})();
