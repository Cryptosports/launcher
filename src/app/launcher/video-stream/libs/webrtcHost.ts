import { BehaviorSubject } from "rxjs";
import * as io from "socket.io-client";

import { setVideoBitrate } from "./modifySdp";
import { emit } from "./socketEmit";

export class WebRTCHost {
	stream: MediaStream;
	bitrate: number;

	socket: SocketIOClient.Socket = null;

	id = new BehaviorSubject<string>(null);
	clients: { [id: string]: RTCPeerConnection } = {};

	log(message: any) {
		console.log(message);
	}

	sendIceCandidate(id: string, e: RTCPeerConnectionIceEvent) {
		const { candidate } = e;

		if (candidate == null) return this.log("ice gathering finished!");

		this.log("sending ice candidate to " + id);
		this.socket.emit("iceCandidateToClient", { id, candidate });
	}

	private modifySDP(sdp: string): string {
		sdp = setVideoBitrate(sdp, this.bitrate);

		this.log(sdp);
		return sdp;
	}

	async onClient(id: string) {
		this.log("new client " + id);

		const conn = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});

		(conn as any).addStream(this.stream);

		conn.addEventListener("icecandidate", e => {
			this.sendIceCandidate(id, e);
		});

		this.log("sending offer to " + id);

		const offer = await conn.createOffer({
			offerToReceiveVideo: false,
			offerToReceiveAudio: false,
		});

		offer.sdp = this.modifySDP(offer.sdp);

		conn.setLocalDescription(offer);
		this.socket.emit("offerToClient", { id, offer });

		this.clients[id] = conn;
	}

	receiveIceCandidate(dto: { id: string; candidate: RTCIceCandidate }) {
		const { id, candidate } = dto;
		this.log("received ice candidate from " + id);

		const conn = this.clients[id];
		if (conn == null) return;

		conn.addIceCandidate(candidate);
	}

	receiveAnswer(dto: { id: string; answer: RTCSessionDescriptionInit }) {
		const { id, answer } = dto;
		this.log("received answer from " + id);

		const conn = this.clients[id];
		if (conn == null) return;

		answer.sdp = this.modifySDP(answer.sdp);
		conn.setRemoteDescription(answer);
	}

	clientDisconnected(id: string) {
		const conn = this.clients[id];
		if (conn == null) return;

		conn.close();
		delete this.clients[id];
	}

	constructor(stream: MediaStream, bitrate: number = 1000) {
		this.stream = stream;
		this.bitrate = bitrate;

		this.socket = io("https://alpha.tivolicloud.com/webrtc");

		this.socket.on("client", id => {
			this.onClient(id);
		});
		this.socket.on("iceCandidate", dto => {
			this.receiveIceCandidate(dto);
		});
		this.socket.on("answer", dto => {
			this.receiveAnswer(dto);
		});
		this.socket.on("clientDisconnected", id => {
			this.clientDisconnected(id);
		});

		emit<string>(this.socket, "host", null).then(id => {
			this.id.next(id);
		});
	}

	destroy() {
		this.socket.disconnect();
		this.id.next(null);
	}
}
