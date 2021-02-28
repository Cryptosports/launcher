import { Component, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { AuthService, User } from "../../auth/auth.service";
import { HttpClient } from "@angular/common/http";
import { displayMinutes, displayPlural } from "../utils";

const require = (window as any).require;

const electron = require("electron");

@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnDestroy {
	user: User = null;
	userSub: Subscription;

	domainStats = { onlineUsers: 0, onlineDomains: 0 };

	constructor(
		private readonly authService: AuthService,
		private readonly http: HttpClient,
	) {
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

	readonly displayMinutes = displayMinutes;
	readonly displayPlural = displayPlural;

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
		electron.shell.openExternal(
			"https://git.tivolicloud.com/tivolicloud/interface/-/issues",
		);
	}

	openMetaversePage() {
		electron.shell.openExternal(this.authService.metaverseUrl);
	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
	}
}
