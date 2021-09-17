import { Component, NgZone, OnInit } from "@angular/core";
import { AnimationOptions } from "ngx-lottie";

const require = (window as any).require;
const electron = require("electron");

@Component({
	selector: "app-auto-update",
	templateUrl: "./auto-update.component.html",
	styleUrls: ["./auto-update.component.scss"],
})
export class AutoUpdateComponent implements OnInit {
	logoOptions: AnimationOptions = {
		path: "./assets/tivoli-loading.json",
		renderer: "svg",
		loop: true,
		autoplay: true,
	};

	text = "Checking for updates...";
	progress = -1;

	constructor(private readonly zone: NgZone) {}

	ngOnInit() {
		electron.ipcRenderer.on("update-error", () => {
			this.zone.run(() => {
				this.text = "Failed to fetch update!";
				this.progress = 0;
			});
			setTimeout(() => {
				electron.ipcRenderer.invoke("update-create-launcher-window");
			}, 2000);
		});

		electron.ipcRenderer.on("update-available", () => {
			this.zone.run(() => {
				this.text = "Downloading update...";
				this.progress = 0;
			});
		});

		electron.ipcRenderer.on(
			"update-download-progress",
			(event: any, progress: number) => {
				this.zone.run(() => {
					this.progress = progress;
				});
			},
		);
	}
}
