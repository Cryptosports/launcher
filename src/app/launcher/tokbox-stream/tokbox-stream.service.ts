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
	stream: MediaStream = null;
	session: any = null;

	constructor(
		private dialog: MatDialog,
		private settingsService: SettingsService,
	) {}

	getSettings() {
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

	getStream() {
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

	destroy = () => {
		this.active = false;

		if (this.session != null) {
			this.session.disconnect();
			this.session == null;
		}
		if (this.stream != null) {
			this.stream.getTracks().forEach(track => track.stop());
			this.stream = null;
		}
	};

	start() {
		return new Promise(async (resolve, reject) => {
			if (this.active) return reject();
			if (!this.OT) return reject();
			this.active = true;

			this.getSettings();

			this.stream = await this.getStream();
			if (this.stream == null) {
				this.destroy();
				return reject();
			}

			this.session = this.OT.initSession(this.apiKey, this.sessionID);

			this.session.on("sessionDisconnected", () => {
				this.destroy();
			});

			this.session.connect(this.publisherToken, async err => {
				if (err) {
					this.destroy();
					return reject(err);
				}

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
							if (err) {
								this.destroy();
								return reject(err);
							}

							resolve();
						});
					},
				);
			});
		});
	}
}
