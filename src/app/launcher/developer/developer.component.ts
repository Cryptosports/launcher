import { Component } from "@angular/core";
import { SettingsService } from "../settings/settings.service";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";

@Component({
	selector: "app-developer",
	templateUrl: "./developer.component.html",
	styleUrls: ["./developer.component.scss"],
})
export class DeveloperComponent {
	constructor(public settingsService: SettingsService) {}

	updateSettingChecked(key: string, event: MatSlideToggleChange) {
		this.settingsService.setSetting(key, event.checked);
	}

	updateSettingString(key: string, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		this.settingsService.setSetting(key, input.value);
	}
}
