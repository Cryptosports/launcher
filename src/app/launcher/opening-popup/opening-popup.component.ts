import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
	selector: "app-opening-popup",
	templateUrl: "./opening-popup.component.html",
	styleUrls: ["./opening-popup.component.scss"],
})
export class OpeningPopupComponent {
	constructor(public dialogRef: MatDialogRef<OpeningPopupComponent>) {}

	onMinimize() {
		const electron = (window as any).require("electron");
		electron.remote.getCurrentWindow().minimize();
	}

	onDismiss() {
		this.dialogRef.close();
	}
}
