const fetch = require("node-fetch");
const StreamZip = require("node-stream-zip");
const path = require("path");
const fs = require("fs");

const ENV = {
	GITLAB_API_TOKEN: process.env.GITLAB_API_TOKEN,
	RELEASE_NUMBER: process.env.RELEASE_NUMBER, // v0.0.0
	UPSTREAM_JOBS_URL: process.env.UPSTREAM_JOBS_URL, // https://git.tivolicloud.com/api/v4/projects/9/pipelines/121/jobs
	UPSTREAM_JOB: process.env.UPSTREAM_JOB, // build windows production
};

if (Object.values(ENV).includes(undefined)) {
	for (const key of Object.keys(ENV)) {
		if (ENV[key] == undefined) console.log("Can't find " + key);
	}
	process.exit(1);
}

function downloadFile(url, dest) {
	return new Promise(async (resolve, reject) => {
		const stream = fs.createWriteStream(dest);
		const res = await fetch(url);
		res.body.pipe(stream);

		res.body.on("error", err => {
			reject(err);
		});
		stream.on("finish", function() {
			resolve();
		});
	});
}

async function downloadInterface() {
	console.log(
		"Searching for interface artifact from: " + ENV.UPSTREAM_JOBS_URL,
	);
	const jobs = await (
		await fetch(ENV.UPSTREAM_JOBS_URL, {
			headers: {
				Authorization: "Bearer " + ENV.GITLAB_API_TOKEN,
			},
		})
	).json();

	// find artifact
	let job = jobs.filter(job => job.name == ENV.UPSTREAM_JOB);
	if (job.length == 0) {
		console.log("Couldn't find job: \"" + ENV.UPSTREAM_JOB + '"');
		process.exit(1);
	}
	job = job[0];

	// download
	const interfaceZipUrl = job.web_url + "/artifacts/download";
	const interfaceZipPath = path.resolve(__dirname, "interface.zip");

	console.log("Downloading zip from: " + interfaceZipUrl);
	await downloadFile(interfaceZipUrl, interfaceZipPath).catch(err => {
		console.log("Failed to download");
		console.log(err);
		process.exit(1);
	});

	// extract
	const interfacePath = path.resolve(__dirname, "../interface");
	console.log("Extracting to: " + interfacePath);

	const zip = new StreamZip({
		file: interfaceZipPath,
	});

	zip.on("ready", () => {
		if (fs.existsSync(interfacePath))
			fs.rmdirSync(interfacePath, { recursive: true });
		fs.mkdirSync(interfacePath);

		zip.extract("build/interface/Release", interfacePath, err => {
			if (err) {
				console.log("Failed to extract");
				console.log(err);
				process.exit(1);
			}

			zip.close();
			console.log("Finished extracting!");
		});
	});
}

function updateVersion() {
	const packagePath = path.resolve("../package.json");
	const package = JSON.parse(fs.readFileSync(packagePath, "utf8"));
	package.version = ENV.RELEASE_NUMBER;

	fs.writeFileSync(packagePath, JSON.stringify(package, null, 4));

	console.log(
		"Updated version to " + package.version + " in: " + packagePath,
	);
}

updateVersion();
console.log("");
downloadInterface();
