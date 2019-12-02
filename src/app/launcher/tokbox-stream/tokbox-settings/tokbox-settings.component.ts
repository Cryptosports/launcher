import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { SettingsService } from "../../settings/settings.service";

@Component({
	selector: "app-tokbox-settings",
	templateUrl: "./tokbox-settings.component.html",
	styleUrls: ["./tokbox-settings.component.scss"],
})
export class TokboxSettingsComponent {
	constructor(
		private dialogRef: MatDialogRef<TokboxSettingsComponent>,
		public settingsService: SettingsService,
	) {
		this.dialogRef.disableClose = true;
	}

	updateSetting(key: string, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		this.settingsService.setSetting(key, input.value);
	}

	async onPasteJSON() {
		const jsonStr = await navigator.clipboard.readText();
		try {
			const data = JSON.parse(jsonStr);

			if (data.apiKey != null)
				this.settingsService.setSetting("tokbox.apiKey", data.apiKey);

			if (data.sessionID != null)
				this.settingsService.setSetting(
					"tokbox.sessionID",
					data.sessionID,
				);

			if (data.publisherToken != null)
				this.settingsService.setSetting(
					"tokbox.publisherToken",
					data.publisherToken,
				);

			if (data.subscriberToken != null)
				this.settingsService.setSetting(
					"tokbox.subscriberToken",
					data.subscriberToken,
				);
		} catch (err) {}
	}

	onSave() {
		this.dialogRef.close();
	}
}
