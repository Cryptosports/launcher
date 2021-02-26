import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { Subscription } from "rxjs";
import { AuthService, User } from "../../auth/auth.service";
import { SettingsService } from "../settings/settings.service";

const require = (window as any).require;

const electron = require("electron");

@Component({
	selector: "app-launch-bar",
	templateUrl: "./launch-bar.component.html",
	styleUrls: ["./launch-bar.component.scss"],
})
export class LaunchBarComponent implements OnInit, OnDestroy {
	user: User = null;
	userSub: Subscription;

	metaverseUrl = this.authService.metaverseUrl;

	hasVr = process.platform == "win32" || process.platform == "linux";

	constructor(
		private authService: AuthService,
		public settingsService: SettingsService,
	) {}

	ngOnInit() {
		this.userSub = this.authService.user$.subscribe(user => {
			this.user = user;
		});
	}

	onSignOut() {
		this.authService.logout();
	}

	openMetaversePage() {
		electron.shell.openExternal(this.metaverseUrl);
	}

	openUserSettingsPage() {
		electron.shell.openExternal(this.metaverseUrl + "/user/settings");
	}

	updateSettingChecked(key: string, event: MatCheckboxChange) {
		this.settingsService.setSetting(key, event.checked);
	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
	}
}
