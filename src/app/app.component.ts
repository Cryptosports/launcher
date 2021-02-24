import { Component, NgZone } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { UpdateAvailableComponent } from "./update-available/update-available.component";
import { AuthService } from "./auth/auth.service";

@Component({
	selector: "app-root",
	templateUrl: "app.component.html",
})
export class AppComponent {
	private updating = false;

	constructor(private dialog: MatDialog, private zone: NgZone) {
		this.checkForUpdate();
	}

	checkForUpdate() {
		if (this.updating) return;

		const ipcRenderer = (window as any).require("electron").ipcRenderer;
		ipcRenderer.send("updater", "check-for-update");

		ipcRenderer.on("updater", (e, msg) => {
			if (this.updating) return;
			if (msg != "update-available") return;

			this.zone.run(() => {
				this.updating = true;
				this.dialog.open(UpdateAvailableComponent, {
					disableClose: true,
					width: "500px",
				});
			});
		});
	}
}
