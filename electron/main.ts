// import * as Sentry from "@sentry/electron";
import {
	app,
	BrowserWindow,
	dialog,
	ipcMain,
	Menu,
	nativeImage,
	shell,
	Tray,
} from "electron";
import { autoUpdater } from "electron-updater";
import { watchFile } from "fs";
import * as path from "path";
import * as express from "express";
import * as getPort from "get-port";

export class TivoliLauncher {
	win: BrowserWindow;
	tray: Tray;

	appLock: boolean;

	DEV = process.env.DEV != null;

	APP_ROOT = path.resolve(__dirname, "../../out/index.html");
	APP_ASSETS = path.resolve(__dirname, "../../assets");

	APP_ICON = nativeImage.createFromPath(
		path.resolve(this.APP_ASSETS, "icon.ico"),
	);

	RUNNING_ICON = nativeImage.createFromPath(
		path.resolve(this.APP_ASSETS, "running.png"),
	);

	isRunning = false;
	isServerRunning = false;
	isQuiting = false;

	createTray() {
		if (this.tray) this.tray.destroy();

		this.tray = new Tray(path.resolve(this.APP_ASSETS, "tray-icon.png"));

		// tray.setToolTip("Tivoli Cloud VR " + app.getVersion());
		// if (process.platform != "darwin") {
		// 	tray.setTitle("Tivoli Cloud VR " + app.getVersion());
		// }
		this.tray.setToolTip("Tivoli Cloud VR");
		if (process.platform != "darwin") {
			this.tray.setTitle("Tivoli Cloud VR");
		}

		this.tray.on("click", () => {
			this.win.show();
		});

		this.tray.setContextMenu(
			Menu.buildFromTemplate([
				{
					icon: path.resolve(this.APP_ASSETS, "tray-icon.png"),
					// label: "Tivoli Cloud VR " + app.getVersion(),
					label: "Tivoli Cloud VR",
					enabled: false,
				},
				{
					type: "separator",
				},
				{
					label: "Open Tivoli interface",
					click: () => {
						this.win.webContents.send("url", "tivoli://");
					},
				},
				{
					label: "Open Tivoli launcher",
					click: () => {
						this.win.show();
					},
				},
				{
					type: "separator",
				},
				{
					label: "My Files",
					click: () => {
						shell.openExternal(
							"https://tivolicloud.com/user/files",
						);
					},
				},
				{
					label: "My Worlds",
					click: () => {
						shell.openExternal(
							"https://tivolicloud.com/user/worlds",
						);
					},
				},
				{
					type: "separator",
				},
				{
					label: "Quit Tivoli",
					click: () => {
						this.isQuiting = true;
						this.win.close();
					},
				},
			]),
		);
	}

	createWindow(autoUpdate: boolean) {
		if (!this.appLock) return;
		if (this.win) this.win.close();

		this.win = new BrowserWindow({
			// title: "Tivoli Cloud VR " + app.getVersion(),
			title: "Tivoli Cloud VR",

			width: autoUpdate ? 350 : 1000,
			height: autoUpdate ? 250 : 640,
			frame: !autoUpdate,

			resizable: this.DEV, // only resizable when developing

			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false, // require()
				backgroundThrottling: false,
				nativeWindowOpen: true,
				devTools: this.DEV,
			},

			icon: this.APP_ICON,
			autoHideMenuBar: true,
		});

		this.win.menuBarVisible = false;

		// that.win.on("minimize", event => {
		// 	event.preventDefault();
		// 	that.win.hide();
		// });

		this.win.on("close", event => {
			if ((this.isRunning || this.isServerRunning) && !this.isQuiting) {
				event.preventDefault();
				this.win.hide();
			}
		});

		this.win.loadFile(this.APP_ROOT, {
			hash: autoUpdate ? "#/auto-update" : "#/",
		});

		if (!autoUpdate) {
			this.createTray();
		}
	}

	constructor() {
		app.on("before-quit", function () {
			this.isQuiting = true;
		});

		this.appLock = !this.DEV ? app.requestSingleInstanceLock() : true;
		if (!this.appLock) app.quit();

		// Sentry.init({
		// 	dsn: "https://59d159ce1c03480d8c13f00d5d5ede3b@sentry.tivolicloud.com/2",
		// 	environment: "production",
		// 	enabled: !DEV,
		// });

		if (!(this.appLock || this.DEV)) return;

		if (this.DEV) {
			// auto reload in dev
			watchFile(this.APP_ROOT, { interval: 500 }, () => {
				if (this.win != null) {
					this.win.loadFile(this.APP_ROOT, {
						hash: "#/",
					});
				}
			});
		}

		// tivoli:// functionality
		app.setAsDefaultProtocolClient("tivoli");

		let openedUrl = null;
		ipcMain.on("url", (e, msg) => {
			if (msg == "get-url")
				if (this.win != null)
					this.win.webContents.send("url", openedUrl);
		});

		const processArgvForUrl = (argv: string[]) => {
			const url = [...argv].pop().toLowerCase();
			if (url.startsWith("tivoli://")) {
				openedUrl = url;
				if (this.win != null)
					this.win.webContents.send("url", openedUrl);
			}
		};

		processArgvForUrl(process.argv);

		app.on("second-instance", (e, argv) => {
			processArgvForUrl(argv);
		});

		// mac
		app.on("open-url", (e, url) => {
			e.preventDefault();
			processArgvForUrl([url]);
		});

		// window time
		app.commandLine.appendSwitch("disable-site-isolation-trials");

		app.on("ready", () => {
			if (this.DEV) {
				this.createWindow(false);
			} else {
				// this.createWindow(!this.DEV);
				// this.win.setProgressBar(-1); // off
				// this.win.setProgressBar(2); // indeterminate
				// this.win.setProgressBar(0.5); // 50%
				// this.win.webContents.once("did-finish-load", () => {});

				autoUpdater.checkForUpdatesAndNotify().catch(error => {
					this.createWindow(true);
					this.win.webContents.once("did-finish-load", () => {
						this.win.webContents.send("update-error");
					});
				});

				ipcMain.handle("update-create-launcher-window", () => {
					this.createWindow(false);
				});

				autoUpdater.on("update-not-available", () => {
					this.createWindow(false);
				});

				autoUpdater.on("update-available", () => {
					this.createWindow(true);
					this.win.webContents.once("did-finish-load", () => {
						this.win.webContents.send("update-available");
					});
				});

				autoUpdater.on("download-progress", e => {
					if (this.win != null) {
						this.win.setProgressBar(e.percent / 100); // x%
						this.win.webContents.send(
							"update-download-progress",
							e.percent,
						);
					}
				});

				autoUpdater.on("update-downloaded", () => {
					autoUpdater.quitAndInstall();
				});
			}
		});

		app.on("activate", () => {
			if (this.win == null) {
				// this.createWindow(!this.DEV);
			} else {
				this.win.show();
			}
		});

		app.on("window-all-closed", () => {
			app.quit();
		});

		// restore if opened twice
		app.on("second-instance", () => {
			if (this.win && !this.DEV) {
				this.win.show();
			}
		});

		// running for changing window icon
		ipcMain.on("running", (e, newIsRunning: boolean) => {
			if (this.win == null) return;

			if (this.isRunning == newIsRunning) return;
			this.isRunning = newIsRunning;

			this.win.setOverlayIcon(
				this.isRunning ? this.RUNNING_ICON : null,
				"Running",
			);
		});

		ipcMain.on("server-running", (e, newIsServerRunning: boolean) => {
			if (this.win == null) return;
			this.isServerRunning = newIsServerRunning;
		});

		// ipc functions
		ipcMain.handle("force-show", e => {
			this.win.setAlwaysOnTop(true);
			this.win.show();
			this.win.setAlwaysOnTop(false);
		});
		ipcMain.handle("hide", e => {
			this.win.hide();
		});
		ipcMain.handle("minimize", e => {
			if (this.win.isMinimized() == false) {
				this.win.minimize();
			}
		});
		ipcMain.handle("show-message-box", async (e, options) => {
			const { response } = await dialog.showMessageBox(options);
			return response;
		});
		ipcMain.handle(
			"show-error-box",
			async (e, title: string, content: string) => {
				dialog.showErrorBox(title, content);
			},
		);
		ipcMain.handle("version", () => {
			return app.getVersion();
		});
		ipcMain.handle("progress-bar", (e, progress: number) => {
			this.win.setProgressBar(progress);
		});

		let expressServer: any = null;

		ipcMain.on("get-auth-token", async (event, metaverseUrl: string) => {
			if (expressServer) expressServer.close();

			const expressApp = express();
			expressApp.get("/signIn", (req, res) => {
				res.send(
					"<script>setInterval(()=>{window.close();},100);window.close();</script>",
				);
				event.reply(
					"auth-token",
					JSON.parse(req.query.token as string),
				);
				if (expressServer) {
					expressServer.close();
					expressServer = null;
				}
			});

			const expressPort = await getPort();
			expressServer = expressApp.listen(expressPort, "127.0.0.1");

			shell.openExternal(
				metaverseUrl + "?launcherSignInPort=" + expressPort,
			);
		});
	}
}

new TivoliLauncher();
