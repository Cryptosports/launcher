import { Injectable, OnInit } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { InterfaceService } from "./interface.service";
import { SettingsService } from "./settings/settings.service";
import { getOsLocalPath } from "./utils";

const require = (window as any).require;
const process = (window as any).process;

const path = require("path");
const electron = require("electron");
const fs = require("fs");
const nodeFetch = require("node-fetch");
const extractZip = require("extract-zip");
const stream = require("stream");

interface Latest {
	version: string;
	date: string;
	windows: {
		filename: string;
		sha256: string;
		size: number;
	};
	linux: {
		filename: string;
		sha256: string;
		size: number;
	};
	macos: {
		filename: string;
		sha256: string;
		size: number;
	};
}

@Injectable({
	providedIn: "root",
})
export class InterfaceUpdaterService {
	public readonly updatesUrl =
		"https://cdn.tivolicloud.com/releases/interface";

	getInterfacePath() {
		const customPath = this.settingsService
			.getSetting<string>("interfaceInstallationPath")
			.getValue();

		if (typeof customPath == "string" && customPath.trim() != "") {
			return customPath.trim();
		} else {
			return path.resolve(getOsLocalPath(), "TivoliCloudVRInterface");
		}
	}

	getInterfaceExePath() {
		switch (process.platform) {
			case "win32":
				return path.resolve(this.getInterfacePath(), "interface.exe");
			case "linux":
				return path.resolve(this.getInterfacePath(), "interface");
			case "darwin":
				return path.resolve(
					this.getInterfacePath(),
					"interface.app/Contents/MacOS/interface",
				);
		}
	}

	progress$ = new BehaviorSubject<number>(0);
	progressFileSize$ = new BehaviorSubject<number>(0);

	updating$ = new BehaviorSubject<boolean>(false);

	currentVersion$ = this.settingsService.getSetting<string>("currentVersion");

	constructor(private readonly settingsService: SettingsService) {
		this.progress$.subscribe(progress => {
			// for windows icon in task bar
			electron.ipcRenderer.invoke(
				"progress-bar",
				progress == 0 ? -1 : progress,
			);
		});
	}

	private async getLatestVersion(): Promise<Latest> {
		const res = await fetch(this.updatesUrl + "/latest.json?" + Date.now());
		const json = await res.json();
		return json;
	}

	async downloadLatest(latest?: Latest) {
		// dont update if already updating
		if (this.updating$.getValue()) return;

		try {
			this.updating$.next(true);
			this.progress$.next(0);
			this.progressFileSize$.next(0);

			if (latest == null) {
				latest = await this.getLatestVersion();
			}

			// recursively remove folder and recreate
			const interfacePath = this.getInterfacePath();
			if (fs.existsSync(interfacePath)) {
				fs.rmdirSync(interfacePath, { recursive: true });
			}
			fs.mkdirSync(interfacePath);

			this.currentVersion$.next("none");

			let zipFilename = "";
			if (process.platform == "win32") {
				zipFilename = latest.windows.filename;
			} else if (process.platform == "linux") {
				zipFilename = latest.linux.filename;
			} else if (process.platform == "darwin") {
				zipFilename = latest.macos.filename;
			} else {
				throw new Error(
					"Interface not available for platform: " + process.platform,
				);
			}

			const zipUrl = this.updatesUrl + "/" + zipFilename;

			// lets use node fetch so we can pipe to fs write stream
			const zipRes = await nodeFetch(zipUrl);
			const zipSize = Number(zipRes.headers.get("content-length"));
			this.progressFileSize$.next(zipSize);

			const zipPath = path.resolve(interfacePath, zipFilename);
			const zipStream = fs.createWriteStream(zipPath);

			// make a progress stream to get progress
			let zipDownloadedSize = 0;
			const progress$ = this.progress$;

			const progressStream = new stream.Transform();
			progressStream._transform = function (chunk, encoding, callback) {
				zipDownloadedSize += chunk.length;
				progress$.next(zipDownloadedSize / zipSize / 2);
				this.push(chunk);
				callback();
			};

			await new Promise((resolve, reject) => {
				zipRes.body.pipe(progressStream).pipe(zipStream);
				zipRes.body.on("error", reject);
				zipStream.on("finish", resolve);
			});

			// unzip and cleanup
			let zipExtractedSize = 0;
			await extractZip(zipPath, {
				dir: interfacePath,
				onEntry: (entry, zipfile) => {
					zipExtractedSize += entry.compressedSize;
					progress$.next(
						0.5 + zipExtractedSize / zipfile.fileSize / 2,
					);
				},
			});
			fs.unlinkSync(zipPath);

			this.updating$.next(false);
			this.progress$.next(0);
			this.progressFileSize$.next(0);

			this.currentVersion$.next(latest.version);
		} catch (error) {
			console.error(error);
			this.updating$.next(false);
			this.progress$.next(0);
			this.progressFileSize$.next(0);
			electron.ipcRenderer.invoke(
				"show-error-box",
				"Failed to update Tivoli",
				"Take a screenshot and let us know. We can help!\n\n" +
					String(error),
			);
		}
	}

	async checkForUpdates() {
		// if not downloaded, download
		if (!fs.existsSync(this.getInterfaceExePath())) {
			this.downloadLatest();
			return;
		}

		const latest = await this.getLatestVersion();
		const current = this.currentVersion$.getValue();

		if (latest.version != current) {
			this.downloadLatest(latest);
		}
	}
}
