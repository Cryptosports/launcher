import { Component, NgZone, OnDestroy } from "@angular/core";
import { AuthService, AuthToken } from "../auth/auth.service";
import { Subscription } from "rxjs";
import { AnimationOptions } from "ngx-lottie";
import { filter, take } from "rxjs/operators";

const require = (window as any).require;

const electron = require("electron");

@Component({
	selector: "app-sign-in",
	templateUrl: "./sign-in.component.html",
	styleUrls: ["./sign-in.component.scss"],
})
export class SignInComponent implements OnDestroy {
	autoLoggingInSub: Subscription = null;

	logoOptions: AnimationOptions = {
		path: "./assets/tivoli-loading.json",
		renderer: "svg",
		loop: true,
		autoplay: true,
	};

	constructor(
		private readonly authService: AuthService,
		private readonly zone: NgZone,
	) {
		this.autoLoggingInSub = this.authService.autoLoggingIn$
			.pipe(filter(autoLoggingIn => autoLoggingIn == false))
			.subscribe(async () => {
				electron.ipcRenderer.once(
					"auth-token",
					(event, token: AuthToken) => {
						this.zone.run(() => {
							this.authService.handleAuthentication(token);
							electron.ipcRenderer.invoke("force-show");
						});
					},
				);
				this.nothingIsHappening();
			});

		this.authService.autoLogin();
	}

	nothingIsHappening() {
		electron.ipcRenderer.send(
			"get-auth-token",
			this.authService.metaverseUrl,
		);
	}

	ngOnDestroy() {
		if (this.autoLoggingInSub) this.autoLoggingInSub.unsubscribe();
	}
}
