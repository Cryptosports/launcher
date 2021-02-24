import { Component } from "@angular/core";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { Router } from "@angular/router";
import { InterfaceSettingsService } from "../interface-settings.service";
import { SettingsService } from "./settings.service";

const require = (window as any).require;

const electron = require("electron");

@Component({
	selector: "app-settings",
	templateUrl: "./settings.component.html",
	styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent {
	constructor(
		public settingsService: SettingsService,
		private readonly interfaceSettingsService: InterfaceSettingsService,
		private readonly router: Router,
	) {}

	updateSettingChecked(key: string, event: MatSlideToggleChange) {
		this.settingsService.setSetting(key, event.checked);
	}

	updateSettingString(key: string, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		this.settingsService.setSetting(key, input.value);
	}

	isWindows = process.platform == "win32";

	async onResetInterfaceSettings() {
		const { response } = await electron.remote.dialog.showMessageBox(null, {
			type: "question",
			buttons: ["OK", "Cancel"],
			defaultId: 1,
			title: "Tivoli Cloud VR",
			message: "Are you sure you want to reset your interface settings?",
			detail: this.interfaceSettingsService.getInterfaceSettingsPath(),
			cancelId: 1,
		});

		if (response == 0) {
			this.interfaceSettingsService.writeInterfaceSettings({});

			electron.remote.dialog.showMessageBox(null, {
				type: "info",
				buttons: ["OK"],
				title: "Tivoli Cloud VR",
				message: "Interface settings successfully reset",
			});
		}
	}

	get resettingInterfaceData() {
		return this.interfaceSettingsService.resettingInterfaceData;
	}

	async onResetInterfaceData() {
		const toBeDeleted = this.interfaceSettingsService.getInterfaceDataPaths();

		const { response } = await electron.remote.dialog.showMessageBox(null, {
			type: "question",
			buttons: ["OK", "Cancel"],
			defaultId: 1,
			title: "Tivoli Cloud VR",
			message: "Are you sure you want to reset your interface data?",
			detail: toBeDeleted.join("\n"),
			cancelId: 1,
		});

		if (response == 0) {
			this.interfaceSettingsService.resetInterfaceData(true);
		}
	}
}
