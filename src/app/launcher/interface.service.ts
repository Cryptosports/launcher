import { Injectable } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService, User } from "../auth/auth.service";

const require = (window as any).require;
const process = (window as any).process;

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

	constructor(private authService: AuthService) {
		this.userSub = this.authService.user.subscribe(user => {
			this.user = user;
		});
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

				"--displayName",
				this.user.username,

				"--url",
				"alpha.tivolicloud.com",

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
		};

		child.on("exit", () => {
			stopRunning();
		});

		// child.stdout.on("data", data => {
		// 	console.log(data);
		// });
	}
}
