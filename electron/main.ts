import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { watchFile } from "fs";
import * as path from "path";
import * as os from "os";

let win: BrowserWindow;

const PLATFORM = os.platform();
const DEV = process.env.DEV != null;

const APP_ROOT = path.resolve(__dirname, "../../out/index.html");
const APP_ICON = (() => {
	if (PLATFORM == "darwin")
		return path.resolve(__dirname, "../../assets/icon.icns");
})();

if (DEV) {
	watchFile(APP_ROOT, { interval: 500 }, () => {
		if (win != null) win.loadFile(APP_ROOT);
	});
}

if (!DEV) {
	Menu.setApplicationMenu(null);
}

const createWindow = () => {
	if (win != null) return;

	win = new BrowserWindow({
		title: "Tivoli Cloud Launcher",

		// minecraft launcher dimensions
		width: 1000,
		height: 639,

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
