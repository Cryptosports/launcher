import { Component, NgZone } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
	selector: "app-update-available",
	templateUrl: "./update-available.component.html",
	styleUrls: ["./update-available.component.scss"],
})
export class UpdateAvailableComponent {
	private readonly ipcRenderer = (window as any).require("electron")
		.ipcRenderer;

	public updateState: 0 | 1 | 2 = 0; // ask, updating, error

	public downloadPercent = 0; // %
	public downloadRemaining = 0; // mb

	private sendMessageToUpdater(msg: string) {
		this.ipcRenderer.send("updater", msg);
	}

	private bytesToMB(bytes: number) {
		return Math.floor(bytes / 1000 / 1000);
	}

	constructor(
		private dialogRef: MatDialogRef<UpdateAvailableComponent>,
		private zone: NgZone,
	) {
		this.ipcRenderer.on("updater", (e, msg, info) => {
			this.zone.run(() => {
				switch (msg) {
					case "download-progress":
						this.updateState = 1;
						this.downloadPercent = Math.floor(info.percent);
						this.downloadRemaining = this.bytesToMB(
							info.total - info.transferred,
						);
						break;

					case "error":
						this.updateState = 2;
						break;
				}
			});
		});
	}

	onDismiss() {
		this.dialogRef.close();
	}

	onUpdate() {
		this.updateState = 1;
		this.sendMessageToUpdater("start-download");
	}
}
