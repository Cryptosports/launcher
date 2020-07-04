import * as Sentry from "@sentry/electron";
import {
	app,
	BrowserWindow,
	ipcMain,
	Menu,
	nativeImage,
	shell,
	Tray,
} from "electron";
import { autoUpdater } from "electron-updater";
import { watchFile } from "fs";
import * as os from "os";
import * as path from "path";

autoUpdater.autoDownload = false;

app.setPath(
	"userData",
	path.resolve(app.getPath("userData"), "../Tivoli Cloud VR/launcher"),
);

let win: BrowserWindow;
let tray: Tray;
let isQuiting = false;

app.on("before-quit", function () {
	isQuiting = true;
});

const PLATFORM = os.platform();
const DEV = process.env.DEV != null;

const appLock = !DEV ? app.requestSingleInstanceLock() : true;
if (!appLock) app.quit();

Sentry.init({
	dsn: "https://59d159ce1c03480d8c13f00d5d5ede3b@sentry.tivolicloud.com/2",
	environment: "production",
	enabled: !DEV,
});

if (appLock || DEV) {
	const APP_ROOT = path.resolve(__dirname, "../../out/index.html");
	const APP_ASSETS = path.resolve(__dirname, "../../assets");

	const APP_ICON = nativeImage.createFromPath(
		path.resolve(APP_ASSETS, "icon.ico"),
	);
	const RUNNING_ICON = nativeImage.createFromPath(
		path.resolve(APP_ASSETS, "running.png"),
	);

	if (DEV) {
		// auto reload in dev
		watchFile(APP_ROOT, { interval: 500 }, () => {
			if (win != null) win.loadFile(APP_ROOT);
		});
	}

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
			if (win != null) win.webContents.send("url", openedUrl);
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

	// fix google logging in (More tools > Network conditions > Chrome - Windows)
	app.userAgentFallback =
		"Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0";

	const createWindow = () => {
		if (!appLock) return;
		if (win != null) return;
		if (tray != null) return;

		win = new BrowserWindow({
			title: "Tivoli Cloud VR " + app.getVersion(),

			width: 1000,
			height: 640,
			resizable: DEV, // only resizable when developing

			webPreferences: {
				nodeIntegration: true,
				//backgroundThrottling: false,
				nativeWindowOpen: true,
				//webSecurity: false,
				devTools: DEV,
			},

			icon: APP_ICON,
			autoHideMenuBar: true,
		});

		tray = new Tray(path.resolve(APP_ASSETS, "icon.png"));
		tray.setToolTip("Tivoli Cloud VR" + app.getVersion());
		tray.setTitle("Tivoli Cloud VR" + app.getVersion());
		tray.on("click", () => {
			win.show();
		});
		tray.setContextMenu(
			Menu.buildFromTemplate([
				{
					icon: path.resolve(APP_ASSETS, "icon.png"),
					label: "Tivoli Cloud VR " + app.getVersion(),
					enabled: false,
				},
				{
					type: "separator",
				},
				{
					label: "Open Tivoli Launcher",
					click: () => {
						win.show();
					},
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
						isQuiting = true;
						win.close();
					},
				},
			]),
		);

		// win.on("minimize", event => {
		// 	event.preventDefault();
		// 	win.hide();
		// });

		win.on("close", event => {
			if (!isQuiting) {
				event.preventDefault();
				win.hide();
			}
		});

		win.on("closed", () => {
			win = null;
		});

		win.loadFile(APP_ROOT);
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
			win.show();
		}
	});

	// running for changing window icon
	let running = false;
	ipcMain.on("running", (e, newRunning: boolean) => {
		if (win == null) return;

		if (running == newRunning) return;
		running = newRunning;

		win.setOverlayIcon(running ? RUNNING_ICON : null, "Running");
	});

	// updater
	const sendUpdateMessage = (msg: string, info: any = null) => {
		if (win == null) return;
		win.webContents.send("updater", msg, info);
	};

	ipcMain.on("updater", (e, msg: string) => {
		if (msg == "check-for-update") {
			if (DEV) return;
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
