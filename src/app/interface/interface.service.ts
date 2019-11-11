import { Injectable } from "@angular/core";
import { User, AuthService } from "../auth/auth.service";
import { Subscription, BehaviorSubject, Subject } from "rxjs";

const require = (window as any).require;
const process = (window as any).process;

const childProcess = require("child_process");
const nodeFetch = require("node-fetch");
const progress = require("progress-stream");
const unzipper = require("unzipper");
const path = require("path");
const fs = require("fs");
const os = require("os");

export interface DownloadProgress {
	type: "downloading" | "extracting";

	percentage: number;
	transferred: number;
	length: number;
	remaining: number;
	eta: number;
	runtime: number;
	delta: number;
	speed: number;
}

export interface DownloadInfo {
	version: string;
	size: number;
}

@Injectable({
	providedIn: "root",
})
export class InterfaceService {
	user: User = null;
	userSub: Subscription = null;

	isRunning = false;

	readonly interfacePath = path.resolve(process.cwd(), "interface");
	readonly interfaceUrl =
		"https://tivolicloud.s3-us-west-2.amazonaws.com/interface-v0.85.0.zip";

	constructor(private authService: AuthService) {
		this.userSub = this.authService.user.subscribe(user => {
			this.user = user;
		});
	}

	downloaded() {
		return fs.existsSync(this.interfacePath);
	}

	async fetchLatest(): Promise<DownloadInfo> {
		const res = await nodeFetch(this.interfaceUrl);
		return {
			version: "0.85.0",
			size: res.headers.get("content-length") as number,
		};
	}

	download() {
		// cant unzip interface without this
		process.noAsar = true;

		const subject = new Subject<DownloadProgress>();

		const zipPath = this.interfacePath + ".zip";
		let extracting = false;

		nodeFetch(this.interfaceUrl).then(res => {
			let length = res.headers.get("content-length");
			const str = progress({
				length,
				time: 100,
			});

			str.on("progress", (downloadProgress: DownloadProgress) => {
				if (extracting) return;
				subject.next({ type: "downloading", ...downloadProgress });

				if (downloadProgress.percentage == 100) {
					extracting = true;

					unzipper.Open.file(zipPath).then(zip => {
						console.log(zip);

						const str = progress({
							length: zip.sizeOfCentralDirectory * 1024,
							time: 100,
						});

						str.on(
							"progress",
							(extractProgress: DownloadProgress) => {
								subject.next({
									type: "extracting",
									...extractProgress,
								});

								if (extractProgress.percentage == 100) {
									subject.complete();

									// delete the zip
									fs.unlinkSync(zipPath);
								}
							},
						);

						fs.createReadStream(zipPath)
							.pipe(str)
							.pipe(
								unzipper.Extract({
									path: this.interfacePath,
									concurrency: os.cpus().length,
								}),
							);
					});
				}
			});

			const dest = fs.createWriteStream(zipPath);
			res.body.pipe(str).pipe(dest);
		});

		return subject;
	}

	launch() {
		if (this.isRunning) return;
		this.isRunning = true;

		const child = childProcess.execFile(
			path.resolve(this.interfacePath, "interface.exe"),
			[
				"--url",
				"alpha.tivolicloud.com",
				"--tokens",
				JSON.stringify(this.user.tokens),
			],
			{
				env: {
					HIFI_METAVERSE_URL: this.authService.metaverseUrl,
				},
			},
		);

		const stopRunning = () => {
			this.isRunning = false;
		};

		child.on("exit", () => {
			stopRunning();
		});

		// child.stdout.on("data", data => {
		// 	console.log(data);
		// });
	}
}
