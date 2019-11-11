import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { DownloadComponent } from "./download/download.component";
import { InterfaceService } from "../interface/interface.service";

@Component({
	selector: "app-launcher",
	templateUrl: "./launcher.component.html",
	styleUrls: ["./launcher.component.scss"],
})
export class LauncherComponent implements OnInit {
	constructor(
		private interfaceService: InterfaceService,
		public dialog: MatDialog,
	) {}

	ngOnInit() {
		if (!this.interfaceService.downloaded())
			this.dialog.open(DownloadComponent, {
				disableClose: true,
			});
	}
}
