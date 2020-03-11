import { Injectable } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { AuthService, User } from "../auth/auth.service";
import { SettingsService } from "./settings/settings.service";
import { HttpClient } from "@angular/common/http";
import { DiscordService } from "./discord.service";
import { InterfaceSettingsService } from "./interface-settings.service";

const require = (window as any).require;
const process = (window as any).process;

const childProcess = require("child_process");
const readline = require("readline");
const electron = require("electron");
const path = require("path");

@Injectable({
	providedIn: "root",
})
export class InterfaceService {
	user: User = null;
	userSub: Subscription = null;

	running$ = new BehaviorSubject<boolean>(false);

	readonly defaultInterfacePath = path.resolve(
		electron.remote.app.getAppPath(),
		"interface",
	);

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

		this.running$.subscribe(running => {
			electron.ipcRenderer.send("running", running);
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

		const interfacePath = this.settingsService.getSetting<boolean>(
			"interfacePathEnabled",
		).value
			? this.settingsService
					.getSetting<string>("interfacePath")
					.value.trim() || this.defaultInterfacePath
			: this.defaultInterfacePath;

		const executablePath = (() => {
			switch (process.platform) {
				case "win32":
					return path.resolve(interfacePath, "interface.exe");
				// case "darwin":
				// 	return path.resolve(
				// 		this.interfacePath,
				// 		this.interfaceVersion + ".app/Contents/MacOS/interface",
				// 	);
				case "linux":
					return path.resolve(interfacePath, "interface");
				default:
					return null;
			}
		})();
		if (executablePath == null) return;

		this.running$.next(true);

		// settings

		// sync
		//await this.interfaceSettingsService.downloadSettings();

		// default settings
		this.interfaceSettingsService.setInterfaceSettings(
			{
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

				"Display/Disable Preview": false,
				disableHmdPreview: false,

				"Avatar/fullAvatarURL":
					"https://cdn.tivolicloud.com/defaultAvatars/matthew/matthew.fst",
				"Avatar/scale": 1,

				"AddressManager/address":
					"alpha.tivolicloud.com:50002/0,0,0/0,0,0,0",
			},
			// settings which will be overwritten/forced
			{
				// necessary for disabling anti aliasing
				"Developer/Render/Temporal Antialiasing (FXAA if disabled)": true,
				antialiasingEnabled: true,

				"Developer/Render/Enable Procedural Materials": true,
				"Render/Enable Procedural Materials": true,

				"Developer/Render/Throttle FPS If Not Focus": false,
				"Render/Throttle FPS If Not Focus": false,

				"Developer/Scripting/Enable Speech Control API": true,
				"Scripting/Enable Speech Control API": true,

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
				"Avatar/displayName": this.user.profile.username,
			},
			// forced default scripts
			["file:///~//defaultScripts.js"],
		);

		// no idea but fixes MyAvatar in /idle/update to be fast
		this.interfaceSettingsService.cleanupAvatarEntityData();

		this.interfaceSettingsService.setDefaultAvatarBookmarks();

		// launch!
		const userLaunchArgs = this.settingsService
			.getSetting<string>("launchArgs")
			.value.split(" ");

		const disableVr = this.settingsService.getSetting<boolean>("disableVr")
			.value;

		this.child = childProcess.spawn(
			executablePath,
			[
				...[
					"--no-updater",
					"--no-launcher",
					"--no-login-suggestion",
					"--suppress-settings-reset",
					process.env.DEV != null ? "--allowMultipleInstances" : "",

					// "--displayName",
					// "--defaultScriptsOverride",

					// "--display",
					// "Desktop?",

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
					HIFI_ENABLE_MATERIAL_PROCEDURAL_SHADERS: "1",
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
