import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { watchFile } from "fs";
import * as path from "path";

let win: BrowserWindow;

const APP_ROOT = path.resolve(__dirname, "../../out/index.html");
const APP_ICON = path.resolve(__dirname, "../../assets/icon.ico");

watchFile(APP_ROOT, { interval: 500 }, () => {
	if (win != null) win.loadFile(APP_ROOT);
});

Menu.setApplicationMenu(null);

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

		// https://iconverticons.com/online
		icon: APP_ICON,

		autoHideMenuBar: true,
	});

	win.loadURL(APP_ROOT);

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
