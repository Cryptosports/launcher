import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import {
	DownloadInfo,
	DownloadProgress,
	InterfaceService,
} from "../../interface/interface.service";

@Component({
	selector: "app-download",
	templateUrl: "./download.component.html",
	styleUrls: ["./download.component.scss"],
})
export class DownloadComponent implements OnInit {
	downloadInfo: DownloadInfo = null;

	downloading = false;
	progress: DownloadProgress = {} as any;
	complete = false;

	constructor(
		private interfaceService: InterfaceService,
		public dialogRef: MatDialogRef<DownloadComponent>,
	) {
		this.interfaceService.fetchLatest().then(info => {
			this.downloadInfo = info;
			this.downloadInfo.size = this.bytesToMB(info.size);
		});
	}

	bytesToMB(bytes: number) {
		return Math.floor(bytes / 1024 / 1024);
	}

	mathFloor(n) {
		return Math.floor(n);
	}

	onDownload() {
		this.interfaceService.download().subscribe(
			progress => {
				this.downloading = true;
				this.progress = progress;
			},
			err => {},
			() => {
				this.complete = true;
			},
		);
	}

	onClose() {
		this.dialogRef.close();
	}

	ngOnInit() {}
}
