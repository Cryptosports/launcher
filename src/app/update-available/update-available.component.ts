import { Component, NgZone } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { AuthService } from "../auth/auth.service";

@Component({
	selector: "app-update-available",
	templateUrl: "./update-available.component.html",
	styleUrls: ["./update-available.component.scss"],
})
export class UpdateAvailableComponent {
	readonly electron = (window as any).require("electron");

	private readonly ipcRenderer = this.electron.ipcRenderer;

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
			return bytes.toFixed(2) + " B/s";
		}

		const kb = bytes / 1000;
		if (kb < 1000) {
			return kb.toFixed(2) + " KB/s";
		}

		const mb = kb / 1000;
		if (mb < 1000) {
			return mb.toFixed(2) + " MB/s";
		}

		const gb = mb / 1000;
		if (gb < 1000) {
			return gb.toFixed(2) + " GB/s";
		}
	}

	constructor(
		private dialogRef: MatDialogRef<UpdateAvailableComponent>,
		private zone: NgZone,
		private readonly authService: AuthService,
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

	onDownloadTivoli() {
		this.electron.shell.openExternal(
			this.authService.metaverseUrl + "/download",
		);
		setTimeout(() => {
			this.sendMessageToUpdater("close");
		}, 1000);
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
