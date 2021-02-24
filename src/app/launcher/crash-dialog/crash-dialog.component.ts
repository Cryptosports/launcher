import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { InterfaceSettingsService } from "../interface-settings.service";
import { InterfaceService } from "../interface.service";

@Component({
	selector: "app-crash-dialog",
	templateUrl: "./crash-dialog.component.html",
	styleUrls: ["./crash-dialog.component.scss"],
})
export class CrashDialogComponent {
	constructor(
		private readonly dialogRef: MatDialogRef<CrashDialogComponent>,
		private readonly interfaceSettingsService: InterfaceSettingsService,
		private readonly interfaceService: InterfaceService,
	) {}

	onDismiss() {
		this.dialogRef.close();
	}

	resetSettingsState: 0 | 1 | 2 = 0;
	onResetSettings() {
		if (this.resetSettingsState == 0) {
			this.resetSettingsState = 1;
		} else if (this.resetSettingsState == 1) {
			this.interfaceSettingsService.writeInterfaceSettings({});
			this.resetSettingsState = 2;
		}
	}

	onRelaunch() {
		this.dialogRef.close();
		this.interfaceService.launch();
	}
}
