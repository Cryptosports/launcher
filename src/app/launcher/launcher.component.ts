import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { InterfaceService } from "./interface.service";
import { SettingsService } from "./settings/settings.service";

@Component({
	selector: "app-launcher",
	templateUrl: "./launcher.component.html",
	styleUrls: ["./launcher.component.scss"],
})
export class LauncherComponent implements OnInit, OnDestroy {
	constructor(
		private interfaceService: InterfaceService,
		public settingsService: SettingsService, // to init defaults
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private dialog: MatDialog,
		private zone: NgZone,
	) {}

	readonly electron = (window as any).require("electron");

	running: boolean;
	runningSub: Subscription;

	ngOnInit() {
		this.router.navigate(["home"], {
			relativeTo: this.activatedRoute,
		});

		this.runningSub = this.interfaceService.running$.subscribe(running => {
			this.zone.run(() => {
				this.running = running;
			});
		});

		// if (!this.interfaceService.downloaded())
		// 	this.dialog.open(DownloadComponent, {
		// 		disableClose: true,
		// 	});
	}

	openDocs() {
		this.electron.shell.openExternal("https://docs.tivolicloud.com");
	}

	onCheckForUpdates() {
		const ipcRenderer = (window as any).require("electron").ipcRenderer;
		ipcRenderer.send("updater", "check-for-update");
	}

	onForceClose() {
		this.interfaceService.forceClose();
	}

	ngOnDestroy() {}
}
