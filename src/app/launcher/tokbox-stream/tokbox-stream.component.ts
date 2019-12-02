import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { TokboxStreamService } from "./tokbox-stream.service";
import { TokboxSettingsComponent } from "./tokbox-settings/tokbox-settings.component";

@Component({
	selector: "app-tokbox-stream",
	templateUrl: "./tokbox-stream.component.html",
	styleUrls: ["./tokbox-stream.component.scss"],
})
export class TokboxStreamComponent {
	active = false;
	loading = false;

	previewStream: MediaStream = null;
	viewerLink = "";

	constructor(
		private dialog: MatDialog,
		public tokboxStreamService: TokboxStreamService,
	) {}

	private makeViewerLink() {
		this.viewerLink =
			"https://tivolicloud.com/stream?data=" +
			btoa(
				JSON.stringify({
					apiKey: this.tokboxStreamService.apiKey,
					sessionID: this.tokboxStreamService.sessionID,
					subscriberToken: this.tokboxStreamService.subscriberToken,
				}),
			);
	}

	async onStart() {
		this.loading = true;

		try {
			await this.tokboxStreamService.start();
			this.previewStream = this.tokboxStreamService.stream;
			this.makeViewerLink();
			this.active = true;
			this.loading = false;
		} catch (err) {
			this.loading = false;
		}
	}

	onStop() {
		this.tokboxStreamService.destroy();
		this.previewStream = null;
		this.viewerLink = "";
		this.active = false;
	}

	onSettings() {
		this.dialog.open(TokboxSettingsComponent, {
			width: "600px",
		});
	}
}
