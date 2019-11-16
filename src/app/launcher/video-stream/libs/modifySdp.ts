function log(message: any) {
	console.log(message);
}

export function setVideoBitrate(sdp: string, bitrate: number): string {
	// https://webrtchacks.com/limit-webrtc-bandwidth-sdp/
	let lines = sdp.split("\r\n");

	let i = 0;
	for (; i < lines.length; i++) {
		if (lines[i].startsWith("m=video")) break;
	}

	log("found m=video!");
	log(lines[i]);

	// next line and skip all i and c lines
	i++;
	while (lines[i].startsWith("i=") || lines[i].startsWith("c=")) {
		i++;
	}

	// replace or add b line
	const b = "b=AS:" + bitrate;
	if (lines[i].startsWith("b=")) {
		log("found b=, modifying");
		lines[i] = b;
	} else {
		log("didnt find b=, inserting");
		lines.splice(i, 0, b);
	}

	log("modified bitrate!");
	return lines.join("\r\n");
}
