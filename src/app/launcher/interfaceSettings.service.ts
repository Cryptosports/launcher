import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { DiscordService } from "./discord.service";
import { SettingsService } from "./settings/settings.service";

const require = (window as any).require;
const process = (window as any).process;

const path = require("path");
const fs = require("fs");

@Injectable({
	providedIn: "root",
})
export class InterfaceSettingsService {
	constructor(
		private authService: AuthService,
		private settingsService: SettingsService,
		private discordService: DiscordService,
		private http: HttpClient,
	) {}

	readInterfaceSettings() {
		const interfacePath = (() => {
			switch (process.platform) {
				case "win32":
					return path.resolve(process.env.APPDATA, "High Fidelity");
				case "darwin":
					return path.resolve(
						process.env.HOME,
						".config/highfidelity.io",
					);
				default:
					return null;
			}
		})();

		const jsonPath = path.resolve(interfacePath, "Interface.json");
		try {
			const jsonStr = fs.readFileSync(jsonPath, "utf8");
			const json = JSON.parse(jsonStr);
			return json;
		} catch (err) {
			return null;
		}
	}

	writeInterfaceSettings(interfaceSettings: Object) {
		const interfacePath = (() => {
			switch (process.platform) {
				case "win32":
					return path.resolve(process.env.APPDATA, "High Fidelity");
				case "darwin":
					return path.resolve(
						process.env.HOME,
						".config/highfidelity.io",
					);
				default:
					return null;
			}
		})();
		if (interfacePath == null) throw Error();
		if (!fs.existsSync(interfacePath)) fs.mkdirSync(interfacePath);

		const jsonPath = path.resolve(interfacePath, "Interface.json");
		fs.writeFileSync(jsonPath, JSON.stringify(interfaceSettings, null, 4));
	}

	setInterfaceSettings(
		defaults: { [s: string]: any },
		overwrite: { [s: string]: any },
	) {
		try {
			const interfaceSettings = this.readInterfaceSettings();

			if (interfaceSettings == null) {
				// create new interface.json file
				this.writeInterfaceSettings({ ...defaults, ...overwrite });
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

				this.writeInterfaceSettings(interfaceSettings);
			}
		} catch (err) {
			console.log(err);
		}
	}

	readAvatarBookmarks() {
		const interfacePath = (() => {
			switch (process.platform) {
				case "win32":
					return path.resolve(process.env.APPDATA, "High Fidelity");
				case "darwin":
					return path.resolve(
						process.env.HOME,
						".config/highfidelity.io",
					);
				default:
					return null;
			}
		})();

		const jsonPath = path.resolve(
			interfacePath,
			"Interface",
			"avatarbookmarks.json",
		);
		try {
			const jsonStr = fs.readFileSync(jsonPath, "utf8");
			const json = JSON.parse(jsonStr);
			return json;
		} catch (err) {
			return null;
		}
	}

	writeAvatarBookmarks(avatarBookmarks: Object) {
		const interfacePath = (() => {
			switch (process.platform) {
				case "win32":
					return path.resolve(process.env.APPDATA, "High Fidelity");
				case "darwin":
					return path.resolve(
						process.env.HOME,
						"Library/Application Support/High Fidelity",
					);
				default:
					return null;
			}
		})();

		if (interfacePath == null) throw Error();
		if (!fs.existsSync(interfacePath)) fs.mkdirSync(interfacePath);

		const interfaceInterfacePath = path.resolve(interfacePath, "Interface");
		if (!fs.existsSync(interfaceInterfacePath))
			fs.mkdirSync(interfaceInterfacePath);

		const avatarBookmarksPath = path.resolve(
			interfaceInterfacePath,
			"avatarbookmarks.json",
		);
		fs.writeFileSync(
			avatarBookmarksPath,
			JSON.stringify(avatarBookmarks, null, 4),
		);
	}

	setDefaultAvatarBookmarks() {
		if (this.readAvatarBookmarks() == null) {
			this.writeAvatarBookmarks({});
		}
	}

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
