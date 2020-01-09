import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { autoUpdater } from "electron-updater";
import { watchFile } from "fs";
import * as os from "os";
import * as path from "path";

let win: BrowserWindow;

const PLATFORM = os.platform();
const DEV = process.env.DEV != null;

app.setPath(
	"userData",
	path.resolve(app.getPath("userData"), "../Tivoli Cloud VR/launcher"),
);

const appLock = !DEV ? app.requestSingleInstanceLock() : true;
if (!appLock) app.quit();

if (appLock || DEV) {
	// setup some constants
	const APP_ROOT = path.resolve(__dirname, "../../out/index.html");
	const APP_ICON = path.resolve(__dirname, "../../assets/icon.ico");

	if (DEV) {
		// auto reload in dev
		watchFile(APP_ROOT, { interval: 500 }, () => {
			if (win != null) win.loadFile(APP_ROOT);
		});
	} else {
		// remove menu in prod
		Menu.setApplicationMenu(null);
	}

	// dont auto download yet!
	autoUpdater.autoDownload = false;

	// tivoli:// functionality
	app.setAsDefaultProtocolClient("tivoli");

	let openedUrl = null;
	ipcMain.on("url", (e, msg) => {
		if (msg == "get-url")
			if (win != null) win.webContents.send("url", openedUrl);
	});

	const processArgvForUrl = (argv: string[]) => {
		const url = [...argv].pop().toLowerCase();
		if (url.startsWith("tivoli://")) {
			openedUrl = url;
			win.webContents.send("url", openedUrl);
		}
	};

	processArgvForUrl(process.argv);

	app.on("second-instance", (e, argv) => {
		processArgvForUrl(argv);
	});

	// // mac
	// app.on("open-url", (event, url) => {
	// 	event.preventDefault();
	// });

	// window time
	const createWindow = () => {
		if (!appLock) return;
		if (win != null) return;

		win = new BrowserWindow({
			title: "Tivoli Cloud Launcher",

			width: 1000,
			height: 640,
			resizable: false,

			webPreferences: {
				nodeIntegration: true,
				backgroundThrottling: false,
				nativeWindowOpen: true,
			},

			icon: APP_ICON,
			autoHideMenuBar: true,
		});

		win.loadFile(APP_ROOT);

		win.on("closed", () => {
			win = null;
		});
	};

	app.on("ready", createWindow);
	app.on("activate", () => {
		if (win == null) createWindow();
	});
	app.on("window-all-closed", () => {
		app.quit();
	});

	// restore if opened twice
	app.on("second-instance", () => {
		if (win && !DEV) {
			if (win.isMinimized()) win.restore();
			win.focus();
		}
	});

	// running for changing window icon
	let running = false;
	ipcMain.on("running", (e, newRunning: boolean) => {
		if (win == null) return;

		if (running == newRunning) return;
		running = newRunning;

		if (running) {
			win.setIcon(APP_ICON.replace("icon", "icon-gray"));
		} else {
			win.setIcon(APP_ICON);
		}
	});

	// updater
	const sendUpdateMessage = (msg: string, info: any = null) => {
		if (win == null) return;
		win.webContents.send("updater", msg, info);
	};

	ipcMain.on("updater", (e, msg: string) => {
		if (msg == "check-for-update") {
			autoUpdater.checkForUpdates();
			return;
		}
		if (msg == "dismiss-update") {
			if (win != null) win.setProgressBar(-1); // off
			return;
		}
		if (msg == "start-download") {
			if (win != null) win.setProgressBar(0); // 0%
			autoUpdater.downloadUpdate();
			return;
		}
	});

	autoUpdater.on("update-available", e => {
		if (win != null) win.setProgressBar(2); // indeterminate
		sendUpdateMessage("update-available");
	});
	// autoUpdater.on("update-not-available", e => {});

	autoUpdater.on("error", e => {
		if (win != null) win.setProgressBar(-1); // off
		sendUpdateMessage("error", e);
	});
	autoUpdater.on("download-progress", e => {
		if (win != null) win.setProgressBar(e.percent / 100); // x%
		sendUpdateMessage("download-progress", e);
	});

	autoUpdater.on("update-downloaded", e => {
		autoUpdater.quitAndInstall();
	});
}
