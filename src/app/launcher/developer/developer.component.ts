import { Component, OnInit } from "@angular/core";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { take } from "rxjs/operators";
import { AuthService } from "../../auth/auth.service";
import { SettingsService } from "../settings/settings.service";

@Component({
	selector: "app-developer",
	templateUrl: "./developer.component.html",
	styleUrls: ["./developer.component.scss"],
})
export class DeveloperComponent implements OnInit {
	readonly electron = (window as any).require("electron");

	constructor(
		public readonly settingsService: SettingsService,
		private readonly authService: AuthService,
	) {}

	token = "";

	ngOnInit() {
		this.authService.user$.pipe(take(1)).subscribe(user => {
			this.token = JSON.stringify(user.token);
		});
	}

	updateSettingChecked(key: string, event: MatSlideToggleChange) {
		this.settingsService.setSetting(key, event.checked);
	}

	updateSettingString(key: string, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		this.settingsService.setSetting(key, input.value);
	}

	onCopyToken(tokenInput: HTMLInputElement) {
		this.electron.clipboard.writeText(this.token);
		tokenInput.disabled = false;
		tokenInput.focus();
		tokenInput.select();
		tokenInput.disabled = true;
	}
}
