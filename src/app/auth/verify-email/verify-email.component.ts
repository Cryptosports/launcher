import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { AuthService, User } from "../auth.service";

@Component({
	selector: "app-verify-email",
	templateUrl: "./verify-email.component.html",
	styleUrls: ["./verify-email.component.scss"],
})
export class VerifyEmailComponent implements OnInit {
	user: User;
	isLoading = false;

	constructor(
		private authService: AuthService,
		private dialogRef: MatDialogRef<VerifyEmailComponent>,
	) {
		this.authService.user$.subscribe(user => {
			this.user = user;
		});
	}

	ngOnInit() {}

	onLogout() {
		this.authService.logout();
		this.dialogRef.close();
	}

	onRefresh() {
		this.isLoading = true;

		const sub = this.authService
			.getUserProfile(this.user.token.access_token)
			.subscribe(
				res => {
					this.isLoading = false;
					if (res.data.user.emailVerified) this.dialogRef.close();
					sub.unsubscribe();
				},
				() => {
					this.isLoading = false;
					sub.unsubscribe();
				},
			);
	}

	onVerify() {
		(window as any)
			.require("electron")
			.shell.openExternal(
				this.authService.metaverseUrl +
					"?token=" +
					this.user.token.access_token,
			);
	}
}
