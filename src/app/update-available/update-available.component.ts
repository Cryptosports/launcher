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

	updateState: 0 | 1 | 2 = 0; // ask, updating, error

	downloadPercent = 0; // %
	downloadTransferred = 0; // mb
	downloadTotal = 0; // mb
	downloadSpeed = "0 B/s";

	private sendMessageToUpdater(msg: string) {
		this.ipcRenderer.send("updater", msg);
	}

	private bytesToMB(bytes: number) {
		return Math.floor(bytes / 1000 / 1000);
	}

	private bytesToSpeedStr(bytes: number) {
		if (bytes < 1000) {
			return Math.floor(bytes) + " B/s";
		}

		const kb = bytes / 1000;
		if (kb < 1000) {
			return Math.floor(kb) + " KB/s";
		}

		const mb = kb / 1000;
		if (mb < 1000) {
			return Math.floor(mb) + " MB/s";
		}

		const gb = mb / 1000;
		if (gb < 1000) {
			return Math.floor(gb) + " GB/s";
		}
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
						this.downloadTransferred = this.bytesToMB(
							info.transferred,
						);
						this.downloadTotal = this.bytesToMB(info.total);
						this.downloadSpeed = this.bytesToSpeedStr(
							info.bytesPerSecond,
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
		this.sendMessageToUpdater("dismiss-update");
	}

	onUpdate() {
		this.updateState = 1;
		this.sendMessageToUpdater("start-download");
	}
}
