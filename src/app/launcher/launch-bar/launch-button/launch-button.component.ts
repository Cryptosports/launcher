import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { InterfaceUpdaterService } from "../../interface-updater.service";
import { InterfaceService } from "../../interface.service";
import { SettingsService } from "../../settings/settings.service";

// const require = (window as any).require;
// const electron = require("electron");

@Component({
	selector: "app-launch-button",
	templateUrl: "./launch-button.component.html",
	styleUrls: ["./launch-button.component.scss"],
})
export class LaunchButtonComponent implements OnInit, OnDestroy {
	subs: Subscription[] = [];

	currentVersion = "unknown";

	running: boolean;

	updating = false;
	progress = 0; // in %
	progressFileSize = 0; // in MB

	constructor(
		public interfaceService: InterfaceService,
		public interfaceUpdaterService: InterfaceUpdaterService,
		public settingsService: SettingsService,
		private zone: NgZone,
	) {}

	ngOnInit() {
		this.subs.push(
			this.interfaceUpdaterService.currentVersion$.subscribe(
				currentVersion => {
					this.zone.run(() => {
						this.currentVersion = currentVersion;
					});
				},
			),
			this.interfaceService.running$.subscribe(running => {
				this.zone.run(() => {
					this.running = running;
				});
			}),
			this.interfaceUpdaterService.updating$.subscribe(updating => {
				this.zone.run(() => {
					this.updating = updating;
				});
			}),
			this.interfaceUpdaterService.progress$.subscribe(progress => {
				this.zone.run(() => {
					this.progress = progress * 100;
				});
			}),
			this.interfaceUpdaterService.progressFileSize$.subscribe(
				progressFileSize => {
					this.zone.run(() => {
						this.progressFileSize = progressFileSize / 1024 / 1024;
					});
				},
			),
		);
	}

	onLaunch() {
		this.interfaceService.launch();
	}

	ngOnDestroy() {
		for (const sub of this.subs) {
			sub.unsubscribe();
		}
	}
}
