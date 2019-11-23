import { Injectable } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService, User } from "../auth/auth.service";

const require = (window as any).require;
const process = (window as any).process;

const DiscordRPC = require("discord-rpc");
const childProcess = require("child_process");
const electron = require("electron");
const path = require("path");
const os = require("os");

@Injectable({
	providedIn: "root",
})
export class InterfaceService {
	user: User = null;
	userSub: Subscription = null;

	isRunning = false;

	readonly interfacePath = path.resolve(
		electron.remote.app.getAppPath(),
		"interface",
	);
	readonly interfaceVersion = "0.85.0";

	private rpc = null;
	readonly rpcClientId = "626510915843653638";

	constructor(private authService: AuthService) {
		this.userSub = this.authService.user.subscribe(user => {
			this.user = user;
		});

		DiscordRPC.register(this.rpcClientId);
		this.rpc = new DiscordRPC.Client({ transport: "ipc" });
		this.rpc
			.login({
				clientId: this.rpcClientId,
			})
			.catch(err => {
				// discord not open
				console.log(err);
			})
			.then(() => {
				this.rpcAtLauncher();

				// // https://discordapp.com/developers/docs/topics/rpc#commands-and-events-rpc-events
				// this.rpc.subscribe(
				// 	"ACTIVITY_JOIN_REQUEST",
				// 	{ clientId: this.rpcClientId },
				// 	e => {
				// 		console.log("join request");
				// 		console.log(e);
				// 	},
				// );

				// this.rpc.subscribe(
				// 	"ACTIVITY_JOIN",
				// 	{ clientId: this.rpcClientId },
				// 	e => {
				// 		console.log("join");
				// 		console.log(e);
				// 	},
				// );

				// console.log(this.rpc);
			});
	}

	private currentDomainId = null;

	rpcAtLauncher() {
		this.currentDomainId = null;

		this.rpc.setActivity({
			details: "Waiting at the launcher...",
		});
	}

	async rpcUpdateDomainId(domainId: string) {
		if (this.currentDomainId == domainId) return;
		this.currentDomainId = domainId;
		//console.log("new domain! " + this.currentDomainId);

		if (this.rpc == null) return;
		if (this.rpc.user == null) return;
		try {
			const res = await fetch(
				this.authService.metaverseUrl +
					"/api/v1/domains/" +
					this.currentDomainId,
			);

			const json: {
				status: "success" | "fail";
				domain: {
					label: string;
					description: string;
					restriction: "open" | "hifi" | "acl";
				};
			} = await res.json();

			if (json.status != "success") throw new Error();
			if (json.domain.restriction == "acl") {
				this.rpc.setActivity({
					details: "Private domain",
					largeImageKey: "header",
					smallImageKey: "logo",
					startTimestamp: new Date(),
				});
				return;
			}

			//console.log("setting activity");
			this.rpc.setActivity({
				details: json.domain.label,
				state: json.domain.description,
				largeImageKey: "header",
				smallImageKey: "logo",
				joinSecret: this.currentDomainId,
				startTimestamp: new Date(),
			});
		} catch (err) {
			try {
				this.rpc.clearActivity({});
			} catch (err) {}
		}
	}

	launch() {
		if (this.isRunning) return;

		const platform = os.platform();

		const executable = (() => {
			if (platform == "darwin")
				return path.resolve(
					this.interfacePath,
					this.interfaceVersion + ".app/Contents/MacOS/interface",
				);
			if (platform == "win32")
				return path.resolve(
					this.interfacePath,
					this.interfaceVersion + "/interface.exe",
				);
			return null;
		})();
		if (executable == null) return;

		this.isRunning = true;

		const child = childProcess.execFile(
			executable,
			[
				"--no-updater",
				"--no-launcher",
				"--no-login-suggestion",
				"--suppress-settings-reset",
				process.env.DEV != null ? "--allowMultipleInstances" : "",

				"--displayName",
				this.user.username,

				"--url",
				"wxr-accelerator-event-tivolicloud",

				"--tokens",
				JSON.stringify(this.user.token),
			],
			{
				env: {
					HIFI_METAVERSE_URL: this.authService.metaverseUrl,
					HIFI_ENABLE_MATERIAL_PROCEDURAL_SHADERS: true,
				},
			},
		);

		const stopRunning = () => {
			this.isRunning = false;
			this.rpcAtLauncher();
		};

		child.on("exit", () => {
			stopRunning();
		});

		let lastData = "";
		child.stdout.on("data", data => {
			const lines = (lastData + data).split("\n");
			lastData = data;

			for (let line of lines) {
				const matches = line.match(
					/\[hifi.networking\] Domain ID changed to "([^]+)"/i,
				);
				if (matches == null) continue;
				if (matches.length >= 2) {
					this.rpcUpdateDomainId(matches[1]);
				}
			}
		});
	}
}
