import { ChangeDetectorRef, Component, OnDestroy, NgZone } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService, User } from "../../auth/auth.service";
import { InterfaceService } from "../interface.service";

@Component({
	selector: "app-launch-bar",
	templateUrl: "./launch-bar.component.html",
	styleUrls: ["./launch-bar.component.scss"],
})
export class LaunchBarComponent implements OnDestroy {
	user: User = null;
	userSub: Subscription;

	running: boolean;
	runningSub: Subscription;

	metaverseUrl = this.authService.metaverseUrl;

	constructor(
		private authService: AuthService,
		public interfaceService: InterfaceService,
		private zone: NgZone, //private dialog: MatDialog,
	) {
		this.userSub = this.authService.user$.subscribe(user => {
			this.user = user;
		});

		this.runningSub = this.interfaceService.running$.subscribe(running => {
			this.zone.run(() => {
				this.running = running;
			});
		});
	}

	onSignOut() {
		this.authService.logout();
	}

	onLaunch() {
		this.interfaceService.launch();
	}

	openMetaversePage() {
		(window as any)
			.require("electron")
			.shell.openExternal(this.metaverseUrl);
	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
		this.runningSub.unsubscribe();
	}
}
