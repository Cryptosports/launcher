import { Component, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService, User } from "../../auth/auth.service";
import { HttpClient } from "@angular/common/http";

@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnDestroy {
	readonly electron = (window as any).require("electron");

	user: User = null;
	userSub: Subscription;

	domainStats = { onlineUsers: 0, onlineDomains: 0 };

	constructor(private authService: AuthService, private http: HttpClient) {
		this.userSub = this.authService.user$.subscribe(user => {
			this.user = user;
		});

		this.getDomainStats();
	}

	getDomainStats() {
		const sub = this.http
			.get<{ onlineUsers: number; onlineDomains: number }>(
				this.authService.metaverseUrl + "/api/domains/stats",
			)
			.subscribe(
				domainStats => {
					this.domainStats = domainStats;
				},
				err => {},
				() => {
					sub.unsubscribe();
				},
			);
	}

	displayMinutes(mins: number): string {
		if (mins >= 60) {
			let hours = Math.floor(mins / 60);
			mins = mins - hours * 60;

			return (
				this.displayPlural(hours, "hour") +
				" " +
				this.displayPlural(mins, "minute")
			);
		} else {
			return mins + (mins == 1 ? " minute" : " minutes");
		}
	}

	displayPlural(n: number, singular: string, plural?: string) {
		return (
			n +
			" " +
			(n == 1 ? singular : plural != null ? plural : singular + "s")
		);
	}

	onReloadStats() {
		const sub = this.authService
			.getUserProfile(this.user.token.access_token)
			.subscribe(
				profile => {
					this.user.profile.minutes = profile.data.user.minutes;
				},
				err => {},
				() => {
					sub.unsubscribe();
				},
			);

		this.getDomainStats();
	}

	openIssues() {
		this.electron.shell.openExternal(
			"https://git.tivolicloud.com/tivolicloud/interface/-/issues",
		);
	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
	}
}
