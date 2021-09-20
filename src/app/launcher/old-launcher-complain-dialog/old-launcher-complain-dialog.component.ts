import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

const require = (window as any).require;

const electron = require("electron");

@Component({
	selector: "app-old-launcher-complain-dialog",
	templateUrl: "./old-launcher-complain-dialog.component.html",
	styleUrls: ["./old-launcher-complain-dialog.component.scss"],
})
export class OldLauncherComplainDialogComponent implements OnInit {
	constructor(
		private readonly dialogRef: MatDialogRef<
			OldLauncherComplainDialogComponent
		>,
	) {}

	ngOnInit() {}

	onDismiss() {
		this.dialogRef.close();
	}

	onOpenOldLauncherFolder() {
		electron.shell.openPath("C:\\Program Files\\Tivoli Cloud VR");
		this.dialogRef.close();
	}
}
