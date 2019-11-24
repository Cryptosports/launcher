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

	displayMinutes(mins: number): string {
		if (mins >= 60) {
			let hours = Math.floor(mins / 60);
			mins = mins - hours * 60;

			return (
				hours +
				(hours == 1 ? " hour" : " hours") +
				" " +
				mins +
				(mins == 1 ? " minute" : " minutes")
			);
		} else {
			return mins + (mins == 1 ? " minute" : " minutes");
		}
	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
	}
}
