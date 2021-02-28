import { Injectable } from "@angular/core";
import { config } from "process";
import { SettingsService } from "./settings/settings.service";

const require = (window as any).require;
const process = (window as any).process;

const path = require("path");
const fs = require("fs");
const os = require("os");
const fsExtra = require("fs-extra");
const electron = require("electron");

@Injectable({
	providedIn: "root",
})
export class InterfaceSettingsService {
	constructor(private readonly settingsService: SettingsService) {}

	private getFolderName() {
		// TODO: what if the interface path is not a dev build
		const interfacePathEnabled = this.settingsService.getSetting<string>(
			"interfacePathEnabled",
		).value;
		const interfacePath = this.settingsService.getSetting<string>(
			"interfacePath",
		).value;

		const isDev = interfacePathEnabled && interfacePath;

		return "Tivoli Cloud VR" + (isDev ? " - dev" : "");
	}

	getConfigPath() {
		return path.resolve(
			process.platform == "win32"
				? path.resolve(os.homedir(), "AppData/Roaming")
				: process.platform == "darwin"
				? path.resolve(os.homedir(), ".config")
				: process.platform == "linux"
				? path.resolve(os.homedir(), ".config")
				: null,
			this.getFolderName(),
		);
	}

	getLocalPath() {
		return path.resolve(
			process.platform == "win32"
				? path.resolve(os.homedir(), "AppData/Local")
				: process.platform == "darwin"
				? path.resolve(os.homedir(), "Library/Application Support")
				: process.platform == "linux"
				? path.resolve(os.homedir(), ".local/share")
				: null,
			this.getFolderName(),
		);
	}

	getInterfaceSettingsPath() {
		return path.resolve(this.getConfigPath(), "Interface.json");
	}

	getInterfaceDataPaths() {
		return [this.getConfigPath(), this.getLocalPath()];
	}

	readInterfaceSettings() {
		const appDataPath = this.getConfigPath();
		const jsonPath = path.resolve(appDataPath, "Interface.json");

		try {
			const jsonStr = fs.readFileSync(jsonPath, "utf8");
			const json = JSON.parse(jsonStr);
			return json;
		} catch (err) {
			return null;
		}
	}

	writeInterfaceSettings(interfaceSettings: Object) {
		const appDataPath = this.getConfigPath();

		if (!fs.existsSync(appDataPath)) fs.mkdirSync(appDataPath);

		const jsonPath = path.resolve(appDataPath, "Interface.json");
		fs.writeFileSync(jsonPath, JSON.stringify(interfaceSettings, null, 4));
	}

	resettingInterfaceData = false;
	async resetInterfaceData(showDialog = false) {
		// TODO: dont delete `this.getConfigPath() + "/launcher"`

		this.resettingInterfaceData = true;
		for (const path of this.getInterfaceDataPaths()) {
			try {
				await fsExtra.remove(path);
			} catch (err) {
				console.error(err);
			}
		}
		this.resettingInterfaceData = false;

		if (showDialog) {
			electron.remote.dialog.showMessageBox(null, {
				type: "info",
				buttons: ["OK"],
				title: "Tivoli Cloud VR",
				message: "Interface data successfully reset",
			});
		}
	}

	setInterfaceSettings(
		defaults: { [s: string]: any },
		overwrite: { [s: string]: any },
		ensureRunningScripts: string[],
	) {
		try {
			const interfaceSettings = this.readInterfaceSettings();

			if (interfaceSettings == null) {
				// create new interface.json file
				this.writeInterfaceSettings({
					...defaults,
					...overwrite,
					RunningScripts: ensureRunningScripts,
				});
			} else {
				// patch interface.json with defaults
				const defaultsKeys = Object.keys(defaults);
				for (let key of defaultsKeys) {
					if (interfaceSettings[key] == null)
						interfaceSettings[key] = defaults[key];
				}

				// patch interface.json with overwwrites
				const overwriteKeys = Object.keys(overwrite);
				for (let key of overwriteKeys) {
					interfaceSettings[key] = overwrite[key];
				}

				// ensure running scripts
				if (interfaceSettings.RunningScripts == null)
					interfaceSettings.RunningScripts = [];

				for (let scriptUrl of ensureRunningScripts) {
					if (!interfaceSettings.RunningScripts.includes(scriptUrl))
						interfaceSettings.RunningScripts.push(scriptUrl);
				}

				this.writeInterfaceSettings(interfaceSettings);
			}
		} catch (err) {
			console.error(err);
		}
	}

	// cleanupAvatarEntityData() {
	// 	try {
	// 		let settings = this.readInterfaceSettings();
	// 		const keys = Object.keys(settings);

	// 		const keysToDelete = keys.filter(key =>
	// 			key.startsWith("Avatar/avatarEntityData"),
	// 		);
	// 		if (keysToDelete.length == 0) return;

	// 		for (const key of keysToDelete) {
	// 			delete settings[key];
	// 		}

	// 		this.writeInterfaceSettings(settings);
	// 	} catch (err) {
	// 		console.error(err);
	// 	}
	// }

	// readAvatarBookmarks() {
	// 	try {
	// 		const appDataPath = this.getAppDataPath();

	// 		const jsonPath = path.resolve(
	// 			appDataPath,
	// 			"Interface",
	// 			"avatarbookmarks.json",
	// 		);

	// 		const jsonStr = fs.readFileSync(jsonPath, "utf8");
	// 		const json = JSON.parse(jsonStr);
	// 		return json;
	// 	} catch (err) {
	// 		return null;
	// 	}
	// }

	// writeAvatarBookmarks(avatarBookmarks: Object) {
	// 	try {
	// 		const appDataPath = this.getAppDataPath();

	// 		if (!fs.existsSync(appDataPath)) fs.mkdirSync(appDataPath);

	// 		const interfaceInterfacePath = path.resolve(
	// 			appDataPath,
	// 			"Interface",
	// 		);
	// 		if (!fs.existsSync(interfaceInterfacePath))
	// 			fs.mkdirSync(interfaceInterfacePath);

	// 		const avatarBookmarksPath = path.resolve(
	// 			interfaceInterfacePath,
	// 			"avatarbookmarks.json",
	// 		);
	// 		fs.writeFileSync(
	// 			avatarBookmarksPath,
	// 			JSON.stringify(avatarBookmarks, null, 4),
	// 		);
	// 	} catch (err) {}
	// }

	// setDefaultAvatarBookmarks() {
	// 	if (this.readAvatarBookmarks() == null) {
	// 		this.writeAvatarBookmarks({});
	// 	}
	// }

	// downloadSettings() {
	// 	return new Promise(resolve => {
	// 		const sub = this.http
	// 			.get<{ interface: any; avatarBookmarks: any }>(
	// 				this.authService.metaverseUrl + "/api/user/settings",
	// 			)
	// 			.subscribe(
	// 				settings => {
	// 					if (settings.interface != null)
	// 						this.writeInterfaceSettings(settings.interface);
	// 					if (settings.avatarBookmarks != null)
	// 						this.writeAvatarBookmarks(settings.avatarBookmarks);

	// 					return resolve();
	// 				},
	// 				err => {
	// 					// no settings uploaded
	// 					return resolve();
	// 				},
	// 				() => {
	// 					sub.unsubscribe();
	// 				},
	// 			);
	// 	});
	// }

	// uploadSettings() {
	// 	return new Promise((resolve, reject) => {
	// 		const data = new FormData();
	// 		data.set("interface", JSON.stringify(this.readInterfaceSettings()));
	// 		data.set(
	// 			"avatarBookmarks",
	// 			JSON.stringify(this.readAvatarBookmarks()),
	// 		);

	// 		const sub = this.http
	// 			.put(this.authService.metaverseUrl + "/api/user/settings", data)
	// 			.subscribe(
	// 				() => {
	// 					return resolve();
	// 				},
	// 				err => {
	// 					return reject(err);
	// 				},
	// 				() => {
	// 					sub.unsubscribe();
	// 				},
	// 			);
	// 	});
	// }
}
