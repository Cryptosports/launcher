// export class WebmConverter {
// 	private interval: number;
// 	private recorder: MediaRecorder;
// 	private mimeType = "video/webm;codecs=vp8";

// 	private mediaSource: MediaSource = null;
// 	private mediaStream: MediaStream = null;

// 	private intervalsToBeCleanedUp = [];

// 	constructor(stream: MediaStream, interval: number = 20) {
// 		this.interval = interval;
// 		this.recorder = new MediaRecorder(stream, {
// 			mimeType: this.mimeType,
// 		});
// 		this.init();
// 	}

// 	private init() {
// 		this.mediaSource = new MediaSource();
// 		this.mediaSource.addEventListener("sourceopen", () => {
// 			const videoSource = this.mediaSource.addSourceBuffer(
// 				this.recorder.mimeType,
// 			);

// 			this.recorder.addEventListener(
// 				"dataavailable",
// 				async (e: BlobEvent) => {
// 					try {
// 						videoSource.appendBuffer(
// 							await (e.data as any).arrayBuffer(),
// 						);
// 					} catch (err) {
// 						const appendBuffer = async () => {
// 							videoSource.appendBuffer(
// 								await (e.data as any).arrayBuffer(),
// 							);

// 							videoSource.removeEventListener(
// 								"updateend",
// 								appendBuffer,
// 							);
// 						};

// 						videoSource.addEventListener("updateend", appendBuffer);
// 					}
// 				},
// 			);

// 			this.recorder.start(this.interval);
// 		});

// 		const video = document.createElement("video");
// 		video.src = URL.createObjectURL(this.mediaSource);

// 		let playing = false;
// 		video.addEventListener("canplay", () => {
// 			if (playing) return;
// 			playing = true;

// 			video.play();
// 			let time = 0;

// 			this.intervalsToBeCleanedUp.push(
// 				setInterval(() => {
// 					time++;
// 					if (time - video.currentTime > 0.1) {
// 						video.currentTime = time;
// 					}
// 				}, 1000),
// 			);
// 		});

// 		document.body.appendChild(video);

// 		this.mediaStream = (video as any).captureStream();
// 	}

// 	public getMediaStream(): Promise<MediaStream> {
// 		return new Promise(resolve => {
// 			const returnMediaStream = () => {
// 				if (this.mediaStream != null)
// 					if (this.mediaStream.getTracks().length > 0) {
// 						if (interval != null) clearInterval(interval);
// 						return resolve(this.mediaStream);
// 					}
// 			};

// 			const interval = setInterval(() => {
// 				returnMediaStream();
// 			}, 100);
// 			returnMediaStream();
// 		});
// 	}

// 	destroy() {
// 		this.recorder.stop();
// 		this.intervalsToBeCleanedUp.forEach(interval => {
// 			clearInterval(interval);
// 		});
// 	}
// }
