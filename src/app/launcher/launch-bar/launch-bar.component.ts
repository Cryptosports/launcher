import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { Subscription } from "rxjs";
import { AuthService, User } from "../../auth/auth.service";
import { InterfaceService } from "../interface.service";
import { SettingsService } from "../settings/settings.service";

@Component({
	selector: "app-launch-bar",
	templateUrl: "./launch-bar.component.html",
	styleUrls: ["./launch-bar.component.scss"],
})
export class LaunchBarComponent implements OnInit, OnDestroy {
	readonly electron = (window as any).require("electron");

	user: User = null;
	userSub: Subscription;

	running: boolean;
	runningSub: Subscription;

	metaverseUrl = this.authService.metaverseUrl;

	currentVersion = this.electron.remote.app.getVersion();

	hasVr = process.platform == "win32";

	constructor(
		private authService: AuthService,
		public interfaceService: InterfaceService,
		public settingsService: SettingsService,
		private zone: NgZone, //private dialog: MatDialog,
	) {}

	ngOnInit() {
		this.userSub = this.authService.user$.subscribe(user => {
			this.user = user;
		});

		this.runningSub = this.interfaceService.running$.subscribe(running => {
			this.zone.run(() => {
				this.running = running;
			});
		});
	}

	onSignOut() {
		this.authService.logout();
	}

	onLaunch() {
		this.interfaceService.launch();
	}

	openMetaversePage() {
		this.electron.shell.openExternal(this.metaverseUrl);
	}

	openUserSettingsPage() {
		this.electron.shell.openExternal(this.metaverseUrl + "/user/settings");
	}

	updateSettingChecked(key: string, event: MatCheckboxChange) {
		this.settingsService.setSetting(key, event.checked);
	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
		this.runningSub.unsubscribe();
	}
}
