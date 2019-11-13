import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { InterfaceService } from "./interface.service";

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
		// if (!this.interfaceService.downloaded())
		// 	this.dialog.open(DownloadComponent, {
		// 		disableClose: true,
		// 	});
	}
}
