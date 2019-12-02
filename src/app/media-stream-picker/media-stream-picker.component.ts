import { Component, EventEmitter, Output, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

interface Source {
	name: string;
	id: string;
	type: "screen" | "video";
	thumbnail: string;
}

@Component({
	selector: "app-media-stream-picker",
	templateUrl: "./media-stream-picker.component.html",
	styleUrls: ["./media-stream-picker.component.scss"],
})
export class MediaStreamPickerComponent {
	private readonly electron = (window as any).require("electron");
	private width = 1280;
	private height = 720;
	private frameRate = 30;

	loading = true;
	availableSources: Source[] = [];
	@Output() mediaStream = new EventEmitter();

	private async getAvailableSources() {
		if (!this.electron) return;

		const screenSources = await this.electron.desktopCapturer.getSources({
			types: ["screen"],
		});

		for (let source of screenSources) {
			this.availableSources.push({
				name: source.name,
				id: source.id,
				type: "screen",
				thumbnail: source.thumbnail.toDataURL(),
			});
		}

		const videoSources = (
			await navigator.mediaDevices.enumerateDevices()
		).filter(source => {
			return source.kind == "videoinput";
		});

		for (let source of videoSources) {
			this.availableSources.push({
				name: source.label,
				id: source.deviceId,
				type: "video",
				thumbnail: "",
			});
		}

		this.loading = false;
	}

	constructor(
		@Inject(MAT_DIALOG_DATA)
		public data: { width: number; height: number; frameRate: number },
		public dialogRef: MatDialogRef<MediaStreamPickerComponent>,
	) {
		if (data.width != null) this.width = data.width;
		if (data.height != null) this.height = data.height;
		if (data.frameRate != null) this.frameRate = data.frameRate;
		this.getAvailableSources();

		const sub = this.dialogRef.beforeClosed().subscribe(() => {
			this.mediaStream.emit(null);
			sub.unsubscribe();
		});
	}

	async onSourceSelected(source: Source) {
		this.loading = true;

		const stream = await navigator.mediaDevices
			.getUserMedia({
				audio: false,
				video: (() => {
					if (source.type == "screen") {
						return {
							mandatory: {
								chromeMediaSource: "desktop",
								chromeMediaSourceId: source.id,
								minWidth: this.width,
								maxWidth: this.width,
								minHeight: this.height,
								maxHeight: this.height,
							},
						} as any;
					} else if (source.type == "video") {
						return {
							deviceId: source.id,
							ideal: {
								width: this.width,
								height: this.height,
								frameRate: this.frameRate,
							},
						};
					} else {
						return {};
					}
				})(),
			})
			.catch(err => {
				this.loading = false;
			});

		if (stream == null) return;

		this.loading = false;
		this.mediaStream.emit(stream);
		this.dialogRef.close();
	}
}
