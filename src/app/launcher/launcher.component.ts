import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { InterfaceService } from "./interface.service";

@Component({
	selector: "app-launcher",
	templateUrl: "./launcher.component.html",
	styleUrls: ["./launcher.component.scss"],
})
export class LauncherComponent implements OnInit, OnDestroy {
	constructor(
		private interfaceService: InterfaceService,
		public dialog: MatDialog,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private zone: NgZone,
	) {}

	running: boolean;
	runningSub: Subscription;

	ngOnInit() {
		this.router.navigate(["home"], {
			relativeTo: this.activatedRoute,
		});

		this.runningSub = this.interfaceService.running$.subscribe(running => {
			this.zone.run(() => {
				this.running = running;
			});
		});

		// if (!this.interfaceService.downloaded())
		// 	this.dialog.open(DownloadComponent, {
		// 		disableClose: true,
		// 	});
	}

	onForceClose() {
		this.interfaceService.forceClose();
	}

	ngOnDestroy() {}
}
