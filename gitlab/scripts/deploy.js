const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs");

const SPACES_KEY = process.env.SPACES_KEY;
const SPACES_SECRET = process.env.SPACES_SECRET;
const SPACES_ENDPOINT = "nyc3.digitaloceanspaces.com";

if (SPACES_KEY == null || SPACES_SECRET == null) {
	if (SPACES_KEY == null) console.log("Can't find SPACES_KEY");
	if (SPACES_SECRET == null) console.log("Can't find SPACES_SECRET");

	process.exit(1);
}

AWS.config.update({
	accessKeyId: SPACES_KEY,
	secretAccessKey: SPACES_SECRET,
});

const spaces = new AWS.S3({
	endpoint: new AWS.Endpoint(SPACES_ENDPOINT),
});

const files = [
	"latest.yml",
	"Tivoli Cloud VR Setup.exe",
	"Tivoli Cloud VR Setup.exe.blockmap",
];

for (const file of files) {
	spaces
		.upload({
			Bucket: "tivolicloud",
			Key: "_releases/" + file,
			Body: fs.readFileSync(path.resolve("../../dist/" + file)),
			ACL: "public-read",
		})
		.catch(err => {
			console.log('Failed to upload "' + file + '"');
			console.log(err);
			process.exit(1);
		});
}
