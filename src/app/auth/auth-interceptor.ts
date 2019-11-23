import {
	HttpEvent,
	HttpHandler,
	HttpHeaders,
	HttpInterceptor,
	HttpRequest,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
	constructor(private authService: AuthService) {}

	intercept(
		req: HttpRequest<any>,
		next: HttpHandler,
	): Observable<HttpEvent<any>> {
		const user = this.authService.user$.getValue();

		if (user == null) {
			return next.handle(req);
		}

		const headers = new HttpHeaders({
			Authorization: "Bearer " + user.token.access_token,
		});

		return next.handle(req.clone({ headers }));
	}
}
