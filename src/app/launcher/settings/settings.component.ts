import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { InterfaceSettingsService } from "../interface-settings.service";
import { InterfaceUpdaterService } from "../interface-updater.service";
import { InterfaceService } from "../interface.service";
import { SettingsService } from "./settings.service";

const require = (window as any).require;

const electron = require("electron");

@Component({
	selector: "app-settings",
	templateUrl: "./settings.component.html",
	styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent implements OnInit, OnDestroy {
	subs: Subscription[] = [];

	readonly isWindows = process.platform == "win32";

	launcherVersion = "loading...";
	interfaceVersion = "loading...";

	updating = false;
	running = false;

	constructor(
		public settingsService: SettingsService,
		private readonly interfaceService: InterfaceService,
		private readonly interfaceSettingsService: InterfaceSettingsService,
		private readonly interfaceUpdaterService: InterfaceUpdaterService,
		private readonly router: Router,
	) {}

	ngOnInit() {
		electron.ipcRenderer.invoke("version").then(v => {
			this.launcherVersion = v;
		});
		this.subs.push(
			this.interfaceUpdaterService.updating$.subscribe(updating => {
				this.updating = updating;
			}),
			this.interfaceUpdaterService.currentVersion$.subscribe(
				currentVersion => {
					this.interfaceVersion = currentVersion;
				},
			),
			this.interfaceService.running$.subscribe(running => {
				this.running = running;
			}),
		);
	}

	updateSettingChecked(key: string, event: MatSlideToggleChange) {
		this.settingsService.setSetting(key, event.checked);
	}

	updateSettingString(key: string, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		this.settingsService.setSetting(key, input.value);
	}

	onRedownloadLatestInterface() {
		this.interfaceUpdaterService.downloadLatest();
	}

	async onResetInterfaceSettings() {
		const response = await electron.ipcRenderer.invoke("show-message-box", {
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

			electron.ipcRenderer.invoke("show-message-box", {
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

		const response = await electron.ipcRenderer.invoke("show-message-box", {
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

	ngOnDestroy() {
		for (const sub of this.subs) {
			sub.unsubscribe();
		}
	}
}
