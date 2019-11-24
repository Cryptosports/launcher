import { Component, OnDestroy } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { Subscription } from "rxjs";

@Component({
	selector: "app-sign-in",
	templateUrl: "./sign-in.component.html",
	styleUrls: ["./sign-in.component.scss"],
})
export class SignInComponent implements OnDestroy {
	autoLoggingIn = false;
	autoLoggingInSub: Subscription = null;

	constructor(private authService: AuthService) {
		this.autoLoggingInSub = authService.autoLoggingIn$.subscribe(
			autoLoggingIn => {
				this.autoLoggingIn = autoLoggingIn;
			},
		);

		this.authService.autoLogin();
	}

	ngOnDestroy() {
		this.autoLoggingInSub.unsubscribe();
	}
}
