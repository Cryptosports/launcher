import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
	providedIn: "root",
})
export class SettingsService {
	private settings: { [s: string]: BehaviorSubject<any> } = {};

	private getSettingFromStorage(key: string): any {
		const value = localStorage.getItem("settings." + key);
		if (value == null) return null;

		try {
			const obj = JSON.parse(value);
			return obj;
		} catch (err) {
			return value;
		}
	}

	private setDefaultSettings(
		defaultSettings: { [s: string]: any },
		overwrite = false,
	) {
		let defaultKeys = Object.keys(defaultSettings);

		for (let key of defaultKeys) {
			let value = null;

			if (overwrite) {
				value = defaultSettings[key];
			} else {
				value = this.getSettingFromStorage(key);
				if (value == null) value = defaultSettings[key];
			}

			localStorage.setItem("settings." + key, value);
			this.settings[key] = new BehaviorSubject<typeof value>(value);
		}

		// clean up unused settings
		Object.keys(localStorage).forEach(entireKey => {
			if (!entireKey.startsWith("settings.")) return;
			const key = entireKey.slice("settings.".length);
			if (defaultKeys.includes(key)) return;

			// delete it!
			localStorage.removeItem(entireKey);
		});
	}

	getSetting<T>(key: string) {
		return this.settings[key] as BehaviorSubject<T>;
	}

	setSetting<T>(key: string, value: T) {
		const setting = this.settings[key] as BehaviorSubject<T>;
		if (setting == null) return;

		localStorage.setItem("settings." + key, value as any);
		setting.next(value);
		return setting;
	}

	constructor() {
		this.setDefaultSettings({
			// launchbar
			disableVr: false,

			// general
			discordRichPresence: true,
			//settingsSyncing: true,

			// developer
			launchArgs: "",

			interfacePathEnabled: false,
			interfacePath: "",

			metaverseUrlEnabled: false,
			metaverseUrl: "",

			// experimental
			videoStreaming: false,
			tokboxStreaming: false,

			// tokbox
			"tokbox.apiKey": "",
			"tokbox.sessionID": "",
			"tokbox.publisherToken": "",
			"tokbox.subscriberToken": "",
			"tokbox.width": 1920,
			"tokbox.height": 1080,
			"tokbox.frameRate": 30,
		});
	}
}
