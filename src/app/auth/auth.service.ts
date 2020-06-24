import {
	HttpClient,
	HttpErrorResponse,
	HttpHeaders,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { BehaviorSubject, Observable, throwError, Subject } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { VerifyEmailComponent } from "./verify-email/verify-email.component";
import { SettingsService } from "../launcher/settings/settings.service";

export interface AuthToken {
	access_token: string;
	created_at: number;
	expires_in: number;
	refresh_token: string;
	scope: "owner";
	token_type: "Bearer";
}

export interface UserProfile {
	id: string;
	username: string;
	email: string;
	emailVerified: boolean;
	minutes: number;
}

export class User {
	constructor(public token: AuthToken, public profile: UserProfile) {}
}

@Injectable({
	providedIn: "root",
})
export class AuthService {
	user$ = new BehaviorSubject<User>(null);
	autoLoggingIn$ = new Subject<boolean>();

	private tokenExpirationTimer: any;
	private jwtHelper = new JwtHelperService();

	private defaultMetaverseUrl = "https://tivolicloud.com";

	readonly metaverseUrl = this.settingsService.getSetting<boolean>(
		"metaverseUrlEnabled",
	).value
		? this.settingsService
				.getSetting<string>("metaverseUrl")
				.value.trim() || this.defaultMetaverseUrl
		: this.defaultMetaverseUrl;

	constructor(
		private http: HttpClient,
		private router: Router,
		private dialog: MatDialog,
		private settingsService: SettingsService,
	) {}

	private handleError = (err: HttpErrorResponse): Observable<never> => {
		//console.log(err);
		if (err.error.message) return throwError(err.error.message);
		if (err.status == 401)
			return throwError("Invalid username and password");
	};

	openEmailVerifyDialog() {
		this.dialog.open(VerifyEmailComponent, {
			width: "400px",
			disableClose: true,
		});
	}

	getUserProfile = (jwt: string) => {
		return this.http.get<{
			status: boolean;
			statusCode?: 401; // unauthorized
			data: {
				user: UserProfile & {
					roles: string[];
				};
			};
		}>(this.metaverseUrl + "/api/v1/user/profile", {
			headers: new HttpHeaders({
				// user isnt available yet in the auth interceptor
				Authorization: "Bearer " + jwt,
			}),
		});
	};

	handleAuthentication = (token: AuthToken) => {
		const jwt = token.access_token;

		if (this.jwtHelper.isTokenExpired(jwt)) {
			this.autoLoggingIn$.next(false);
			return throwError("Token expired");
		}

		const sub = this.getUserProfile(jwt).subscribe(
			async res => {
				if (res.statusCode == 401) {
					this.autoLoggingIn$.next(false);
					return;
				}
				const profile = res.data.user;

				const user = new User(token, profile);
				if (profile.emailVerified == false)
					this.openEmailVerifyDialog();

				const payload = this.jwtHelper.decodeToken(jwt);
				const msTillExpire =
					+new Date(payload.exp * 1000) - +new Date();

				this.autoLogout(msTillExpire);
				this.user$.next(user);
				localStorage.setItem("auth", JSON.stringify(token));

				await this.router.navigateByUrl("/launcher");
				this.autoLoggingIn$.next(false);
			},
			() => {
				this.autoLoggingIn$.next(false);
			},
			() => {
				sub.unsubscribe();
			},
		);
	};

	signIn(signInDto: { username: string; password: string }) {
		return this.http
			.post<AuthToken>(this.metaverseUrl + "/oauth/token", {
				grant_type: "password",
				username: signInDto.username,
				password: signInDto.password,
				scope: "owner",
			})
			.pipe(catchError(this.handleError), tap(this.handleAuthentication));
	}

	extSignUp(extSignUpDto: { token: string; username: string }) {
		return this.http
			.post<AuthToken>(
				this.metaverseUrl + "/api/auth/signup-external",
				extSignUpDto,
			)
			.pipe(catchError(this.handleError), tap(this.handleAuthentication));
	}

	autoLogin() {
		const tokenStr = localStorage.getItem("auth");
		if (!tokenStr) return this.autoLoggingIn$.next(false);

		try {
			const token = JSON.parse(tokenStr);
			this.autoLoggingIn$.next(true);
			this.handleAuthentication(token);
		} catch (err) {
			this.autoLoggingIn$.next(false);
		}
	}

	logout() {
		this.user$.next(null);
		this.router.navigate(["/"]);
		localStorage.removeItem("auth");
		if (this.tokenExpirationTimer) {
			clearTimeout(this.tokenExpirationTimer);
		}
	}

	autoLogout(msTillExpire: number) {
		if (msTillExpire > 0x7fffffff) return;

		this.tokenExpirationTimer = setTimeout(() => {
			this.logout();
		}, msTillExpire);
	}
}
