import { Injectable } from "@angular/core";
import { WebmConverter } from "./libs/webmConverter";
import { WebRTCHost } from "./libs/webrtcHost";

@Injectable({
	providedIn: "root",
})
export class VideoStreamService {
	stream: MediaStream;
	webm: WebmConverter;
	webrtc: WebRTCHost;

	id = "";
	webmStream: MediaStream = null;
	active = false;

	private getMediaStream(width = 1280, height = 720, frameRate = 30) {
		return navigator.mediaDevices.getUserMedia({
			video: {
				width: { ideal: width },
				height: { ideal: height },
				frameRate,
			},
		});
	}

	async start() {
		if (this.active) return;
		this.active = true;

		this.stream = await this.getMediaStream(854, 480, 24);
		this.webm = new WebmConverter(this.stream);

		this.webmStream = await this.webm.getMediaStream();

		this.webrtc = new WebRTCHost(this.webmStream);
		this.webrtc.id.subscribe(id => {
			this.id = id;
		});
	}

	stop() {
		if (!this.active) return;

		this.webm.destroy();
		this.webm = null;
		this.webrtc.destroy();
		this.webrtc = null;

		this.id = "";
		this.webmStream = null;
		this.active = false;
	}
}
