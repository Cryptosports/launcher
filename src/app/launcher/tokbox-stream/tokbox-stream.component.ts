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
	constructor(
		private dialog: MatDialog,
		public tokboxStreamService: TokboxStreamService,
	) {}

	onStart() {
		this.tokboxStreamService.start();
	}

	onStop() {
		this.tokboxStreamService.destroy();
	}

	onSettings() {
		this.dialog.open(TokboxSettingsComponent, {
			width: "600px",
		});
	}
}
