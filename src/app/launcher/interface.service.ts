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
				return path.resolve(this.interfacePath, "0.85.0.app");
			if (platform == "win32")
				return path.resolve(this.interfacePath, "0.85.0/interface.exe");
			return null;
		})();
		if (executable == null) return;

		this.isRunning = true;

		const child = childProcess.execFile(
			executable,
			[
				"--no-launcher",
				"--suppress-settings-reset",
				"--url",
				"alpha.tivolicloud.com",
				"--tokens",
				JSON.stringify(this.user.token),
			],
			{
				env: {
					HIFI_METAVERSE_URL: this.authService.metaverseUrl,
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
