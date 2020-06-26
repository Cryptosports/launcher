import { Component } from "@angular/core";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { Router } from "@angular/router";
import { InterfaceSettingsService } from "../interface-settings.service";
import { SettingsService } from "./settings.service";

const require = (window as any).require;

const electron = require("electron");
const fsExtra = require("fs-extra");
const path = require("path");

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

	async onRemoveAllSettings() {
		const configPath = this.interfaceSettingsService.getConfigPath();
		const localPath = this.interfaceSettingsService.getLocalPath();

		const toBeDeleted = [
			path.resolve(configPath, "Interface"),
			path.resolve(configPath, "Interface.json"),
			localPath,
		];

		const { response } = await electron.remote.dialog.showMessageBox(null, {
			type: "question",
			buttons: ["Cancel", "OK"],
			title: "Tivoli Cloud VR",
			message: "Are you sure you want to remove all your settings?",
			detail: toBeDeleted.join("\n"),
		});

		if (response > 0) {
			for (const path of toBeDeleted) {
				try {
					await fsExtra.remove(path);
				} catch (err) {
					console.error(err);
				}
			}

			this.router.navigate(["launcher", "home"]);

			electron.remote.dialog.showMessageBox(null, {
				type: "info",
				buttons: ["OK"],
				title: "Tivoli Cloud VR",
				message: "Interface settings removed",
			});
		}
	}
}
