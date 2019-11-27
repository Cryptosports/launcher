import { Component } from "@angular/core";
import { SettingsService } from "./settings.service";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";

@Component({
	selector: "app-settings",
	templateUrl: "./settings.component.html",
	styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent {
	constructor(public settingsService: SettingsService) {}

	updateSetting(key: string, event: MatSlideToggleChange) {
		this.settingsService.setSetting(key, event.checked);
	}
}
