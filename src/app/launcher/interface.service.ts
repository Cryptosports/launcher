import { Injectable } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { AuthService, User } from "../auth/auth.service";
import { SettingsService } from "./settings/settings.service";

const require = (window as any).require;
const process = (window as any).process;

const DiscordRPC = require("discord-rpc");
const childProcess = require("child_process");
const readline = require("readline");
const electron = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");

@Injectable({
	providedIn: "root",
})
export class InterfaceService {
	user: User = null;
	userSub: Subscription = null;

	running$ = new BehaviorSubject<boolean>(false);

	readonly interfacePath = path.resolve(
		electron.remote.app.getAppPath(),
		"interface",
	);
	readonly interfaceVersion = "0.85.0";

	private child = null;

	private rpc = null;

	constructor(
		private authService: AuthService,
		private settingsService: SettingsService,
	) {
		this.userSub = this.authService.user$.subscribe(user => {
			this.user = user;
		});

		this.settingsService
			.getSetting("discordRichPresence")
			.subscribe(enabled => {
				if (enabled) {
					this.rpc = new DiscordRPC.Client({ transport: "ipc" });
					this.rpc
						.login({
							clientId: "626510915843653638",
						})
						.catch(err => {
							console.log(err);
						})
						.then(() => {
							this.rpcAtLauncher();
						});
				} else {
					if (this.rpc != null) {
						this.rpc.destroy();
						this.rpc = null;
					}
				}
			});

		electron.ipcRenderer.send("url", "get-url");
		electron.ipcRenderer.on("url", (e, url: string) => {
			if (url == null) return;
			url = url.toLowerCase();

			if (!url.startsWith("tivoli://")) return;
			url = url.slice("tivoli://".length);

			this.launch(url);
		});
	}

	private currentDomainId = null;

	rpcAtLauncher() {
		this.currentDomainId = null;

		if (this.rpc == null) return;
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

			this.rpc.setActivity({
				details: json.domain.label,
				state: json.domain.description,
				largeImageKey: "header",
				smallImageKey: "logo",
				//joinSecret: this.currentDomainId,
				startTimestamp: new Date(),
			});
		} catch (err) {
			try {
				this.rpc.clearActivity({});
			} catch (err) {}
		}
	}

	private setInterfaceSettings(
		defaults: { [s: string]: any },
		overwrite: { [s: string]: any },
	) {
		try {
			const interfacePath = (() => {
				switch (process.platform) {
					case "win32":
						return path.resolve(
							process.env.APPDATA,
							"High Fidelity",
						);
					case "darwin":
						return path.resolve(
							process.env.HOME,
							".config/highfidelity.io",
						);
					default:
						return null;
				}
			})();
			if (interfacePath == null) throw Error();
			if (!fs.existsSync(interfacePath)) fs.mkdirSync(interfacePath);

			const jsonPath = path.resolve(interfacePath, "Interface.json");

			if (!fs.existsSync(jsonPath)) {
				fs.writeFileSync(
					jsonPath,
					JSON.stringify({ ...defaults, ...overwrite }, null, 4) +
						"\n",
				);
			} else {
				const jsonStr = fs.readFileSync(jsonPath, "utf8");
				const json = JSON.parse(jsonStr);

				const defaultsKeys = Object.keys(defaults);
				for (let key of defaultsKeys) {
					if (json[key] == null) json[key] = defaults[key];
				}

				const overwriteKeys = Object.keys(overwrite);
				for (let key of overwriteKeys) {
					json[key] = overwrite[key];
				}

				fs.writeFileSync(
					jsonPath,
					JSON.stringify(json, null, 4) + "\n",
				);
			}
		} catch (err) {
			console.log(err);
		}
	}

	private setDefaultEmptyAvatarBookmarks() {
		try {
			const interfacePath = (() => {
				switch (process.platform) {
					case "win32":
						return path.resolve(
							process.env.APPDATA,
							"High Fidelity",
						);
					case "darwin":
						return path.resolve(
							process.env.HOME,
							".config/highfidelity.io",
						);
					default:
						return null;
				}
			})();

			if (interfacePath == null) throw Error();
			if (!fs.existsSync(interfacePath)) fs.mkdirSync(interfacePath);

			const interfaceInterfacePath = path.join(
				interfacePath,
				"Interface",
			);
			if (!fs.existsSync(interfaceInterfacePath))
				fs.mkdirSync(interfaceInterfacePath);

			const avatarBookmarksPath = path.resolve(
				interfaceInterfacePath,
				"avatarbookmarks.json",
			);

			if (!fs.existsSync(avatarBookmarksPath))
				fs.writeFileSync(avatarBookmarksPath, JSON.stringify({}));
		} catch (err) {}
	}

	launch(url?: string) {
		if (this.running$.value == true) return;

		const platform = os.platform();
		const executable = (() => {
			switch (process.platform) {
				case "win32":
					return path.resolve(
						this.interfacePath,
						this.interfaceVersion + "/interface.exe",
					);
				case "darwin":
					return path.resolve(
						this.interfacePath,
						this.interfaceVersion + ".app/Contents/MacOS/interface",
					);
				default:
					return null;
			}
		})();
		if (executable == null) return;
		this.running$.next(true);

		this.setInterfaceSettings(
			{
				"Maximum Texture Memory/4 MB": false,
				"Maximum Texture Memory/64 MB": false,
				"Maximum Texture Memory/256 MB": false,
				"Maximum Texture Memory/512 MB": false,
				"Maximum Texture Memory/1024 MB": false,
				"Maximum Texture Memory/2048 MB": false,
				"Maximum Texture Memory/4096 MB": true,
				"Maximum Texture Memory/6144 MB": false,
				"Maximum Texture Memory/8192 MB": false,
				"Maximum Texture Memory/Automatic Texture Memory": false,
				"Developer/Render/Maximum Texture Memory/4 MB": false,
				"Developer/Render/Maximum Texture Memory/64 MB": false,
				"Developer/Render/Maximum Texture Memory/256 MB": false,
				"Developer/Render/Maximum Texture Memory/512 MB": false,
				"Developer/Render/Maximum Texture Memory/1024 MB": false,
				"Developer/Render/Maximum Texture Memory/2048 MB": false,
				"Developer/Render/Maximum Texture Memory/4096 MB": true,
				"Developer/Render/Maximum Texture Memory/6144 MB": false,
				"Developer/Render/Maximum Texture Memory/8192 MB": false,
				"Developer/Render/Maximum Texture Memory/Automatic Texture Memory": false,

				"Display/Disable Preview": false,
				disableHmdPreview: false,

				"com.tivolicloud.firstTimeAvatar": true,

				"Avatar/fullAvatarURL":
					"https://cdn.tivolicloud.com/defaultAvatars/Robimo_white/Robimo_white.fst",
				"Avatar/scale": 1.333,

				"AddressManager/address":
					"hifi://alpha.tivolicloud.com:50162/0,0.5,0",
			},
			{
				// necessary for disabling anti aliasing
				"Developer/Render/Temporal Antialiasing (FXAA if disabled)": true,
				antialiasingEnabled: true,

				"Edit/Create Entities As Grabbable (except Zones, Particles, and Lights)": false,

				// no, its unethical
				"Developer/Network/Disable Activity Logger": true,
				"Network/Disable Activity Logger": true,
				UserActivityLoggerDisabled: true,

				"Avatar/flyingHMD": true,
				allowTeleporting: false,

				miniTabletEnabled: false,
				use3DKeyboard: false,
			},
		);

		this.setDefaultEmptyAvatarBookmarks();

		const userLaunchArgs = this.settingsService
			.getSetting<String>("launchArgs")
			.value.split(" ");

		this.child = childProcess.spawn(
			executable,
			[
				...[
					"--no-updater",
					"--no-launcher",
					"--no-login-suggestion",
					"--suppress-settings-reset",
					process.env.DEV != null ? "--allowMultipleInstances" : "",

					"--displayName",
					this.user.username,

					// "--defaultScriptsOverride",
					// "https://cdn.tivolicloud.com/defaultScripts/awdefaultScripts.js",

					"--url",
					url != null ? url : "alpha.tivolicloud.com:50162/0,0.5,0",

					"--tokens",
					JSON.stringify(this.user.token),
				],
				...userLaunchArgs,
			],
			{
				env: {
					...process.env,
					HIFI_METAVERSE_URL: this.authService.metaverseUrl,
					HIFI_ENABLE_MATERIAL_PROCEDURAL_SHADERS: false,
				},
				detached: false,
			},
		);

		const stopRunning = () => {
			this.running$.next(false);
			this.rpcAtLauncher();
		};

		this.child.on("exit", () => {
			stopRunning();
		});

		const rl = readline.createInterface({
			input: this.child.stdout,
			terminal: false,
			historySize: 10,
		});

		rl.on("line", (line: string) => {
			// discord rpc
			const updatedDomainIdMatches = line.match(
				/\[hifi\.networking\] Domain ID changed to "([^]+)"/i,
			);
			if (updatedDomainIdMatches != null) {
				if (updatedDomainIdMatches.length >= 2) {
					this.rpcUpdateDomainId(updatedDomainIdMatches[1]);
				}
			}

			// minimize launcher when interface opens
			if (/\[hifi\.interface\] Created Display Window/i.test(line)) {
				const win = electron.remote.getCurrentWindow();
				if (win.isMinimized() == false) {
					win.minimize();
				}
			}
		});
	}

	forceClose() {
		if (this.running$.value == false) return;
		if (this.child == null) return;
		this.child.kill("SIGKILL");
	}
}
