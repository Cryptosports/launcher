import { Component, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService, User } from "../../auth/auth.service";

@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnDestroy {
	user: User = null;
	userSub: Subscription;

	constructor(private authService: AuthService) {
		this.userSub = this.authService.user$.subscribe(user => {
			this.user = user;
		});
	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
	}
}
