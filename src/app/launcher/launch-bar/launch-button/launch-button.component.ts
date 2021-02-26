import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { InterfaceService } from "../../interface.service";
import { SettingsService } from "../../settings/settings.service";

const require = (window as any).require;

const electron = require("electron");

@Component({
	selector: "app-launch-button",
	templateUrl: "./launch-button.component.html",
	styleUrls: ["./launch-button.component.scss"],
})
export class LaunchButtonComponent implements OnInit, OnDestroy {
	currentVersion = electron.remote.app.getVersion();

	running: boolean;
	runningSub: Subscription;

	constructor(
		public interfaceService: InterfaceService,
		public settingsService: SettingsService,
		private zone: NgZone,
	) {}

	ngOnInit() {
		this.runningSub = this.interfaceService.running$.subscribe(running => {
			this.zone.run(() => {
				this.running = running;
			});
		});
	}

	onLaunch() {
		this.interfaceService.launch();
	}

	ngOnDestroy() {
		this.runningSub.unsubscribe();
	}
}
