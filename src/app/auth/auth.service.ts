import {
	HttpClient,
	HttpErrorResponse,
	HttpHeaders,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";

interface AuthResponse {
	access_token: string;
	created_at: number;
	expires_in: number;
	refresh_token: string;
	scope: string;
	token_type: string;
}

export class User {
	constructor(
		public id: string,
		public username: string,
		public email: string,
		public tokens: AuthResponse,
	) {}
}

@Injectable({
	providedIn: "root",
})
export class AuthService {
	user = new BehaviorSubject<User>(null);

	private tokenExpirationTimer: any;
	private jwtHelper = new JwtHelperService();

	readonly metaverseUrl = "https://alpha.tivolicloud.com";

	constructor(private http: HttpClient, private router: Router) {}

	private handleError = (err: HttpErrorResponse): Observable<never> => {
		//console.log(err);
		return throwError(err.statusText);
	};

	handleAuthentication = (res: AuthResponse) => {
		const jwt = res.access_token;

		if (this.jwtHelper.isTokenExpired(jwt))
			return throwError("Token expired");

		const sub = this.http
			.get<{
				status: boolean;
				data: {
					user: {
						id: string;
						username: string;
						email: string;
						roles: string;
					};
				};
			}>(this.metaverseUrl + "/api/v1/user/profile", {
				headers: new HttpHeaders({
					// user isnt available yet in the auth interceptor
					Authorization: "Bearer " + jwt,
				}),
			})
			.subscribe(
				profile => {
					const { id, username, email } = profile.data.user;

					const user = new User(id, username, email, res);

					const token = this.jwtHelper.decodeToken(jwt);
					const msTillExpire =
						+new Date(token.exp * 1000) - +new Date();

					this.autoLogout(msTillExpire);
					this.user.next(user);
					localStorage.setItem("auth", JSON.stringify(res));

					this.router.navigateByUrl("/launcher");
				},
				() => {},
				() => {
					sub.unsubscribe();
				},
			);
	};

	signUp(signUpDto: { email: string; username: string; password: string }) {
		return this.http
			.post<AuthResponse>(
				this.metaverseUrl + "/api/auth/signup",
				signUpDto,
			)
			.pipe(catchError(this.handleError), tap(this.handleAuthentication));
	}

	signIn(signInDto: { username: string; password: string }) {
		return this.http
			.post<AuthResponse>(this.metaverseUrl + "/oauth/token", {
				grant_type: "password",
				username: signInDto.username,
				password: signInDto.password,
				scope: "owner",
			})
			.pipe(catchError(this.handleError), tap(this.handleAuthentication));
	}

	autoLogin() {
		const token = localStorage.getItem("auth");
		if (!token) return;
		try {
			const res = JSON.parse(token) as AuthResponse;
			this.handleAuthentication(res);
		} catch (err) {}
	}

	logout() {
		this.user.next(null);
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
