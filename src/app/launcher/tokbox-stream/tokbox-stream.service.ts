import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MediaStreamPickerComponent } from "../../media-stream-picker/media-stream-picker.component";
import { SettingsService } from "../settings/settings.service";

@Injectable({
	providedIn: "root",
})
export class TokboxStreamService {
	private readonly OT = (window as any).OT;

	apiKey = "";
	sessionID = "";
	publisherToken = "";
	subscriberToken = "";

	width = 0;
	height = 0;
	frameRate = 0;

	active = false;
	ready = false;
	viewerLink = "";

	stream: MediaStream = null;
	session: any = null;

	constructor(
		private dialog: MatDialog,
		private settingsService: SettingsService,
	) {}

	private getSettings() {
		this.apiKey = this.settingsService.getSetting<string>(
			"tokbox.apiKey",
		).value;
		this.sessionID = this.settingsService.getSetting<string>(
			"tokbox.sessionID",
		).value;
		this.publisherToken = this.settingsService.getSetting<string>(
			"tokbox.publisherToken",
		).value;
		this.subscriberToken = this.settingsService.getSetting<string>(
			"tokbox.subscriberToken",
		).value;

		this.width = this.settingsService.getSetting<number>(
			"tokbox.width",
		).value;
		this.height = this.settingsService.getSetting<number>(
			"tokbox.height",
		).value;
		this.frameRate = this.settingsService.getSetting<number>(
			"tokbox.frameRate",
		).value;
	}

	private getStream() {
		return new Promise<MediaStream>(resolve => {
			const dialog = this.dialog.open(MediaStreamPickerComponent, {
				data: {
					width: this.width,
					height: this.height,
					frameRate: this.frameRate,
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

	private makeViewerLink() {
		this.viewerLink =
			"https://tivolicloud.com/stream?data=" +
			btoa(
				JSON.stringify({
					apiKey: this.apiKey,
					sessionID: this.sessionID,
					subscriberToken: this.subscriberToken,
				}),
			);
	}

	destroy = () => {
		this.active = false;
		this.ready = false;
		this.viewerLink = "";

		if (this.session != null) {
			this.session.disconnect();
			this.session == null;
		}
		if (this.stream != null) {
			this.stream.getTracks().forEach(track => track.stop());
			this.stream = null;
		}
	};

	async start() {
		if (this.active) return;
		if (!this.OT) return;
		this.active = true;

		this.getSettings();

		this.stream = await this.getStream();
		if (this.stream == null) return this.destroy();

		this.session = this.OT.initSession(this.apiKey, this.sessionID);

		this.session.on("sessionDisconnected", () => {
			this.destroy();
		});

		this.session.connect(this.publisherToken, async err => {
			if (err) return this.destroy();

			const publisher = this.OT.initPublisher(
				null,
				{
					videoSource: this.stream.getVideoTracks()[0],

					audioSource: null,
					disableAudioProcessing: true, // echo cancellation
					publishAudio: false,

					width: this.width,
					height: this.height,
					frameRate: this.frameRate,
				},
				err => {
					if (err) return console.log(err);

					this.session.publish(publisher, err => {
						if (err) return this.destroy();

						this.makeViewerLink();
						this.ready = true;
					});
				},
			);
		});
	}
}
