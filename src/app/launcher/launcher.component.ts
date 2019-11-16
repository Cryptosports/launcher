import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
	selector: "app-launcher",
	templateUrl: "./launcher.component.html",
	styleUrls: ["./launcher.component.scss"],
})
export class LauncherComponent implements OnInit {
	constructor(
		//private interfaceService: InterfaceService,
		public dialog: MatDialog,
		private router: Router,
		private activatedRoute: ActivatedRoute,
	) {}

	ngOnInit() {
		this.router.navigate(["home"], {
			relativeTo: this.activatedRoute,
		});

		// if (!this.interfaceService.downloaded())
		// 	this.dialog.open(DownloadComponent, {
		// 		disableClose: true,
		// 	});
	}
}
