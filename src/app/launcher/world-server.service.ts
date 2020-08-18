import { Injectable } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { InterfaceService } from "./interface.service";

const require = (window as any).require;

const childProcess = require("child_process");
const electron = require("electron");
const path = require("path");

class Process {
	child;
	crashes = 0;
	stopped = true;

	constructor(
		public readonly exec: string,
		public readonly args: string[],
		public readonly env = {},
	) {}

	start() {
		if (this.child != null) return;

		this.stopped = false;

		console.log("Starting process", this.exec, this.args, this.env);

		this.child = childProcess.spawn(this.exec, this.args, {
			env: this.env,
			detached: false,
		});
		this.child.on("exit", (code: number, signal: string) => {
			console.log("Process exited", this.exec, code, signal);

			if (this.child == null) return;
			this.child = null;

			if (this.stopped) return;

			this.crashes++;
			setTimeout(() => {
				this.crashes--;
			}, 1000 * 60 * 5);

			if (this.crashes < 30) {
				this.start();
				console.log("Restarting...");
			} else {
				console.log("Not restarting because too many crashes");
			}
		});
	}

	stop() {
		if (this.child == null) return;
		console.log("Stopping process", this.exec, this.args, this.env);
		this.stopped = true;
		this.child.kill("SIGTERM");
	}
}

@Injectable({
	providedIn: "root",
})
export class WorldServerService {
	running = false;

	processes: {
		"Domain Server": Process;
		"Audio Mixer": Process;
		"Avatar Mixer": Process;
		"Scripted Agent": Process;
		"Asset Server": Process;
		"Messages Mixer": Process;
		"Entity Script Server": Process;
		"Entities Server": Process;
	} = {
		"Domain Server": null,
		"Audio Mixer": null,
		"Avatar Mixer": null,
		"Scripted Agent": null,
		"Asset Server": null,
		"Messages Mixer": null,
		"Entity Script Server": null,
		"Entities Server": null,
	};

	constructor(
		private readonly interfaceService: InterfaceService,
		private readonly authService: AuthService,
	) {
		const interfacePath = this.interfaceService.getInterfacePath();
		const domainServerPath = path.resolve(
			interfacePath,
			"domain-server.exe",
		);
		const assignmentClientPath = path.resolve(
			interfacePath,
			"assignment-client.exe",
		);

		const env = {
			HIFI_METAVERSE_URL: this.authService.metaverseUrl,
		};

		this.processes["Domain Server"] = new Process(
			domainServerPath,
			[],
			env,
		);

		const assignmentClientTypes = {
			"Audio Mixer": 0,
			"Avatar Mixer": 1,
			"Scripted Agent": 2,
			"Asset Server": 3,
			"Messages Mixer": 4,
			"Entity Script Server": 5,
			"Entities Server": 6,
		};
		for (const type of Object.keys(assignmentClientTypes)) {
			const id: number = assignmentClientTypes[type];
			if (this.processes[type] == null) {
				this.processes[type] = new Process(
					assignmentClientPath,
					[
						"-t",
						String(id),
						"-a",
						"127.0.0.1",
						...(id == 2
							? ["--max", "100"]
							: ["-p", String(48000 + id)]),
					],
					env,
				);
			}
		}
	}

	start() {
		for (const type of Object.keys(this.processes)) {
			try {
				const process = this.processes[type];
				if (process != null) process.start();
			} catch (err) {}
		}
		this.running = true;
		electron.ipcRenderer.send("server-running", true);
	}

	stop() {
		for (const type of Object.keys(this.processes)) {
			try {
				const process = this.processes[type];
				if (process != null) process.stop();
			} catch (err) {}
		}
		this.running = false;
		electron.ipcRenderer.send("server-running", false);
	}
}
