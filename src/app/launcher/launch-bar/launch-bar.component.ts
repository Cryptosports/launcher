import {
	Component,
	OnInit,
	OnDestroy,
	ChangeDetectorRef,
	HostListener,
} from "@angular/core";
import { AuthService, User } from "../../auth/auth.service";
import { Subscription } from "rxjs";
import { InterfaceService } from "../interface.service";

@Component({
	selector: "app-launch-bar",
	templateUrl: "./launch-bar.component.html",
	styleUrls: ["./launch-bar.component.scss"],
})
export class LaunchBarComponent implements OnDestroy {
	user: User = null;
	userSub: Subscription;

	metaverseUrl = this.authService.metaverseUrl;

	constructor(
		private authService: AuthService,
		public interfaceService: InterfaceService,
		private ref: ChangeDetectorRef,
	) {
		this.userSub = this.authService.user.subscribe(user => {
			this.user = user;
		});

		window.addEventListener("focus", () => {
			this.ref.detectChanges();
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
	}
}
