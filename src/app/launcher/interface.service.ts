import { Injectable } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { AuthService, User } from "../auth/auth.service";
import { SettingsService } from "./settings/settings.service";
import { HttpClient } from "@angular/common/http";
import { DiscordService } from "./discord.service";
import { InterfaceSettingsService } from "./interfaceSettings.service";

const require = (window as any).require;
const process = (window as any).process;

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
	readonly interfaceVersion = "0.86.0";

	private child = null;

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

		this.discordService.initialize();

		// setInterval(() => {
		// 	if (!this.running$.value) return;
		// 	this.interfaceSettingsService.uploadSettings();
		// }, 1000 * 60 * 5);

		// needs to be fixed
		electron.ipcRenderer.send("url", "get-url");
		electron.ipcRenderer.on("url", (e, url: string) => {
			if (url == null) return;
			url = url.toLowerCase();

			if (!url.startsWith("tivoli://")) return;
			url = url.slice("tivoli://".length);

			this.launch(url);
		});
	}

	async launch(url?: string) {
		if (this.running$.value == true) return;

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

		// ensure settings are synced
		//await this.interfaceSettingsService.downloadSettings();

		// ensure default settings
		this.interfaceSettingsService.setInterfaceSettings(
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
				"Avatar/scale": 1.2,

				"AddressManager/address":
					"hifi://alpha.tivolicloud.com:50002/0,0,0/0,0,0,0",
			},
			{
				// necessary for disabling anti aliasing
				"Developer/Render/Temporal Antialiasing (FXAA if disabled)": true,
				antialiasingEnabled: true,

				// necessary for default location
				firstRun: false,

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
				"Avatar/displayName": this.user.username,
			},
		);
		this.interfaceSettingsService.setDefaultAvatarBookmarks();

		// launch!
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

					// "--displayName",
					// "--defaultScriptsOverride",

					"--tokens",
					JSON.stringify(this.user.token),
				],
				...(url != null ? ["--url", url] : []),
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
			this.discordService.atLauncher();
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
					this.discordService.updateDomainId(
						updatedDomainIdMatches[1],
					);
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
		//this.interfaceSettingsService.uploadSettings();
	}
}
