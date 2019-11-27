import { app, BrowserWindow, Menu, ipcRenderer, ipcMain } from "electron";
import { watchFile } from "fs";
import * as os from "os";
import * as path from "path";
import { autoUpdater } from "electron-updater";

let win: BrowserWindow;

const PLATFORM = os.platform();
const DEV = process.env.DEV != null;

const appLock = app.requestSingleInstanceLock();
if (!DEV && !appLock) app.quit();

const APP_ROOT = path.resolve(__dirname, "../../out/index.html");
const APP_ICON = (() => {
	if (PLATFORM == "darwin")
		return path.resolve(__dirname, "../../assets/icon.icns");
	if (PLATFORM == "win32")
		return path.resolve(__dirname, "../../assets/icon.ico");
})();

if (DEV) {
	watchFile(APP_ROOT, { interval: 500 }, () => {
		if (win != null) win.loadFile(APP_ROOT);
	});
}

if (!DEV) {
	Menu.setApplicationMenu(null);
}

autoUpdater.autoDownload = false;

const createWindow = () => {
	if (!appLock) return;
	if (win != null) return;

	win = new BrowserWindow({
		title: "Tivoli Cloud Launcher",

		width: 1000,
		height: 640,

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

app.on("second-instance", () => {
	if (win && !DEV) if (win.isMinimized()) win.restore();
});

// updater
function sendUpdateMessage(msg: string, info: any = null) {
	if (win == null) return;
	win.webContents.send("updater", msg, info);
}

ipcMain.on("updater", (e, msg: string) => {
	if (msg == "check-for-update") {
		if (!DEV) autoUpdater.checkForUpdates();
		return;
	}
	if (msg == "start-download") {
		autoUpdater.downloadUpdate();
		return;
	}
});

autoUpdater.on("update-available", e => {
	sendUpdateMessage("update-available");
});
// autoUpdater.on("update-not-available", e => {});

autoUpdater.on("error", e => {
	sendUpdateMessage("error", e);
});
autoUpdater.on("download-progress", e => {
	sendUpdateMessage("download-progress", e);
});

autoUpdater.on("update-downloaded", e => {
	autoUpdater.quitAndInstall();
});
