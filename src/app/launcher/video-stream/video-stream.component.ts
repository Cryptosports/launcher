import { Component } from "@angular/core";
import { VideoStreamService } from "./video-stream.service";

@Component({
	selector: "app-video-stream",
	templateUrl: "./video-stream.component.html",
	styleUrls: ["./video-stream.component.scss"],
})
export class VideoStreamComponent {
	constructor(public videoStreamService: VideoStreamService) {}

	start() {
		this.videoStreamService.start();
	}

	stop() {
		this.videoStreamService.stop();
	}
}
