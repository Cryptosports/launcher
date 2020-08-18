import { Injectable } from "@angular/core";
import { BehaviorSubject, Subscription, Subject } from "rxjs";
import { AuthService, User } from "../auth/auth.service";
import { SettingsService } from "./settings/settings.service";
import { HttpClient } from "@angular/common/http";
import { DiscordService } from "./discord.service";
import { InterfaceSettingsService } from "./interface-settings.service";
import { environment } from "../../environments/environment";

const require = (window as any).require;
const process = (window as any).process;

const childProcess = require("child_process");
const readline = require("readline");
const electron = require("electron");
const path = require("path");
const fs = require("fs");

@Injectable({
	providedIn: "root",
})
export class InterfaceService {
	user: User = null;
	userSub: Subscription = null;

	running$ = new BehaviorSubject<boolean>(false);

	logs: string[] = [];
	log$ = new Subject<string>();

	private child = null;
	private children = [];

	constructor(
		private authService: AuthService,
		private settingsService: SettingsService,
		private discordService: DiscordService,
		private interfaceSettingsService: InterfaceSettingsService,
		private http: HttpClient,
	) {
		this.userSub = this.authService.user$.subscribe(user => {
			this.user = user;
		});

		this.running$.subscribe(running => {
			electron.ipcRenderer.send("running", running);
		});

		this.discordService.initialize();

		// setInterval(() => {
		// 	if (!this.running$.value) return;
		// 	this.interfaceSettingsService.uploadSettings();
		// }, 1000 * 60 * 5);

		electron.ipcRenderer.send("url", "get-url");
		electron.ipcRenderer.on("url", (e, url: string) => {
			if (url == null) return;
			url = url.toLowerCase();

			if (!url.startsWith("tivoli://")) return;
			url = url.slice("tivoli://".length);

			this.launch(url);
		});
	}

	showErrorMessage(message: string, detail?: string) {
		electron.remote.dialog.showMessageBox(null, {
			type: "error",
			buttons: ["OK"],
			title: "Tivoli Cloud VR",
			message,
			detail,
		});
	}

	getInterfacePath() {
		const defaultInterfacePath = path.resolve(
			electron.remote.app.getAppPath(),
			"interface",
		);

		const interfacePath = this.settingsService.getSetting<boolean>(
			"interfacePathEnabled",
		).value
			? this.settingsService
					.getSetting<string>("interfacePath")
					.value.trim() || defaultInterfacePath
			: defaultInterfacePath;

		return interfacePath;
	}

	async launch(url?: string) {
		// disabled so tivoli:// works
		// if (this.running$.value == true) return;

		const interfacePath = this.getInterfacePath();

		const executablePath = (() => {
			switch (process.platform) {
				case "win32":
					return path.resolve(interfacePath, "interface.exe");
				case "darwin":
					return path.resolve(
						interfacePath,
						fs.existsSync(path.resolve(interfacePath, "interface"))
							? "interface"
							: "interface.app/Contents/MacOS/interface",
					);
				case "linux":
					return path.resolve(
						interfacePath,
						fs.existsSync(path.resolve(interfacePath, "interface"))
							? "interface"
							: "interface.AppDir/interface",
					);
				default:
					return null;
			}
		})();
		if (executablePath == null || fs.existsSync(executablePath) == false)
			return this.showErrorMessage(
				"Tivoli path not found",
				executablePath,
			);

		const alreadyRunning = this.running$.value;
		if (alreadyRunning == false) this.running$.next(true);

		try {
			// sync settings
			//await this.interfaceSettingsService.downloadSettings();

			// settings
			this.interfaceSettingsService.setInterfaceSettings(
				// default settings
				{
					"Display/Disable Preview": false,
					disableHmdPreview: false,
				},
				// settings which will be overwritten/forced
				{
					// force maximum to 8192 MB
					"Maximum Texture Memory/4 MB": false,
					"Maximum Texture Memory/64 MB": false,
					"Maximum Texture Memory/256 MB": false,
					"Maximum Texture Memory/512 MB": false,
					"Maximum Texture Memory/1024 MB": false,
					"Maximum Texture Memory/2048 MB": false,
					"Maximum Texture Memory/4096 MB": false,
					"Maximum Texture Memory/6144 MB": false,
					"Maximum Texture Memory/8192 MB": true,
					"Maximum Texture Memory/Automatic Texture Memory": false,
					"Developer/Render/Maximum Texture Memory/4 MB": false,
					"Developer/Render/Maximum Texture Memory/64 MB": false,
					"Developer/Render/Maximum Texture Memory/256 MB": false,
					"Developer/Render/Maximum Texture Memory/512 MB": false,
					"Developer/Render/Maximum Texture Memory/1024 MB": false,
					"Developer/Render/Maximum Texture Memory/2048 MB": false,
					"Developer/Render/Maximum Texture Memory/4096 MB": false,
					"Developer/Render/Maximum Texture Memory/6144 MB": false,
					"Developer/Render/Maximum Texture Memory/8192 MB": true,
					"Developer/Render/Maximum Texture Memory/Automatic Texture Memory": false,

					// 100% unethical
					"Developer/Network/Disable Activity Logger": true,
					"Network/Disable Activity Logger": true,
					UserActivityLoggerDisabled: true,

					// for convinence
					"Display/Fullscreen": false,

					// terrible
					"Edit/Create Entities As Grabbable (except Zones, Particles, and Lights)": false,
					"Avatar/flyingHMD": true,
					allowTeleporting: false,
					miniTabletEnabled: false,
					use3DKeyboard: false,

					// usernames dont change
					"Avatar/displayName": this.user.profile.username,
				},
				// forced default scripts
				["file:///~//defaultScripts.js"],
			);

			// no idea but fixes MyAvatar in /idle/update to be fast
			this.interfaceSettingsService.cleanupAvatarEntityData();

			// launch!
			const userLaunchArgs = this.settingsService
				.getSetting<string>("launchArgs")
				.value.trim()
				.split(" ");

			const userLaunchEnvStr = this.settingsService
				.getSetting<string>("launchEnv")
				.value.trim();
			const userLaunchEnv =
				userLaunchEnvStr.length == 0
					? {}
					: userLaunchEnvStr.split(" ").reduce((all, current) => {
							const split = current.split("=");
							all[split[0]] = split.length > 1 ? split[1] : "";
							return all;
					  }, {});

			const disableVr = this.settingsService.getSetting<boolean>(
				"disableVr",
			).value;

			const child = childProcess.spawn(
				executablePath,
				[
					...[
						// process.env.DEV != null ? "--allowMultipleInstances" : "",

						// "--displayName",
						// "--defaultScriptsOverride",

						"--tokens",
						JSON.stringify(this.user.token),
					],

					...(disableVr
						? [
								"--disable-displays",
								"OpenVR (Vive),Oculus Rift",
								"--disable-inputs",
								"OpenVR (Vive),Oculus Rift",
						  ]
						: []),

					...(url != null ? ["--url", url] : []),

					...userLaunchArgs,
				],
				{
					env: {
						...process.env,
						HIFI_METAVERSE_URL: this.authService.metaverseUrl,
						...userLaunchEnv,
					},
					detached: false,
				},
			);

			this.children.push(child);

			if (alreadyRunning) {
				const win = electron.remote.getCurrentWindow();
				if (win.isMinimized() == false) {
					win.minimize();
				}
				return;
			} else {
				this.child = child;
			}

			child.on("exit", (code: number, signal: string) => {
				this.forceClose(child);

				if (!environment.production) {
					console.log("Exit code: " + code);
					console.log("Exit signal: " + signal);
				}

				if (code == 0 || code == null) return;

				const lastLogs = this.logs.slice(
					this.logs.length - 6,
					this.logs.length,
				);

				this.showErrorMessage(
					"Tivoli exited with code: " + code,
					this.logs && this.logs.length > 0
						? `Last ${lastLogs.length} logs:\n` +
								lastLogs.join("\n")
						: null,
				);
			});

			this.logs = [];
			this.log$.next("CLEAR_LOGS");

			[child.stdout, child.stderr]
				.map(input =>
					readline.createInterface({
						input,
						terminal: false,
						historySize: 0,
					}),
				)
				.forEach(rl => {
					rl.on("line", (line: string) => {
						if (!environment.production) console.log(line);

						this.log$.next(line);
						this.logs.push(line);
						if (this.logs.length > 10000) this.logs.shift();

						// discord rpc
						const updatedDomainIdMatches = line.match(
							/\[hifi\.networking\] Domain ID changed to "([^]+)"/i,
						);
						if (updatedDomainIdMatches != null) {
							if (updatedDomainIdMatches.length >= 2) {
								this.discordService.updateDomainId(
									updatedDomainIdMatches[1],
								);
							}
						}

						// minimize launcher when interface opens
						if (
							/\[hifi\.interface\] Created Display Window/i.test(
								line,
							)
						) {
							const win = electron.remote.getCurrentWindow();
							// if (win.isMinimized() == false) {
							// 	win.minimize();
							// }
							win.hide();
						}
					});
				});
		} catch (err) {
			this.forceClose();
			this.showErrorMessage("Tivoli failed to launch", err);
			return;
		}
	}

	forceClose(child?) {
		this.running$.next(false);
		this.discordService.atLauncher();

		const kill = (signal: string) => {
			if (child) child.kill(signal);
			if (this.child) this.child.kill(signal);
			for (const child of this.children) {
				child.kill(signal);
			}
		};

		// kill("SIGQUIT");
		// setTimeout(() => {
		kill("SIGKILL");
		// }, 500);

		this.children = [];

		//this.interfaceSettingsService.uploadSettings();
	}
}
