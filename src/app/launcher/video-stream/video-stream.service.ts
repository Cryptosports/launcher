import { Injectable } from "@angular/core";
// import { WebmConverter } from "./libs/webmConverter";
import { WebRTCHost } from "./libs/webrtcHost";
import { MatDialog } from "@angular/material/dialog";
import { MediaStreamPickerComponent } from "../../media-stream-picker/media-stream-picker.component";

@Injectable({
	providedIn: "root",
})
export class VideoStreamService {
	webrtc: WebRTCHost;
	stream: MediaStream;

	// webm: WebmConverter;
	// webmStream: MediaStream = null;

	id = "";
	active = false;

	constructor(private dialog: MatDialog) {}

	getStream() {
		return new Promise<MediaStream>(resolve => {
			const dialog = this.dialog.open(MediaStreamPickerComponent, {
				data: {
					width: 1280,
					height: 720,
					frameRate: 30,
				},
			});

			const sub = dialog.componentInstance.mediaStream.subscribe(
				stream => {
					resolve(stream);
				},
				err => {},
				() => {
					sub.unsubscribe();
				},
			);
		});
	}

	async start() {
		if (this.active) return;
		this.active = true;

		this.stream = await this.getStream();

		//this.webm = new WebmConverter(this.stream);
		//this.webmStream = await this.webm.getMediaStream();

		this.webrtc = new WebRTCHost(this.stream);
		this.webrtc.id.subscribe(id => {
			this.id = id;
		});
	}

	stop() {
		if (!this.active) return;

		// this.webm.destroy();
		// this.webm = null;
		// this.webmStream = null;

		this.webrtc.destroy();
		this.webrtc = null;

		this.id = "";
		this.active = false;
	}
}
