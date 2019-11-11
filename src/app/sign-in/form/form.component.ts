import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../auth/auth.service";

@Component({
	selector: "app-form",
	templateUrl: "./form.component.html",
	styleUrls: ["./form.component.scss"],
})
export class FormComponent implements OnInit {
	errorMessage = "";

	inSignUpMode = false;
	isLoading = false;

	signInForm: FormGroup = null as any;
	signUpForm: FormGroup = null as any;

	//extServices = ["Google", "Discord", "GitHub"];
	extServices = [];

	constructor(private authService: AuthService) {}

	usernameValidator(control: FormControl): { [s: string]: boolean } | null {
		let value: string = control.value + "";

		if (!/^[a-zA-Z0-9\.\_]+$/.test(value)) return { badCharacters: true };

		if (!/^[^\.\_][a-zA-Z0-9\.\_]*[^\.\_]$/.test(value))
			return { startEndDotUnderscore: true };

		if (value.includes("..") || value.includes("__"))
			return { repeatingDotsUnderscores: true };

		if (value.includes("._") || value.includes("_."))
			return { nextToDotsUnderscores: true };

		return null;
	}

	ngOnInit() {
		this.signInForm = new FormGroup({
			username: new FormControl(null, [
				Validators.required,
				Validators.minLength(4),
				Validators.maxLength(64), // email too
			]),
			password: new FormControl(null, [
				Validators.required,
				Validators.minLength(6),
				Validators.maxLength(64),
			]),
		});

		this.signUpForm = new FormGroup({
			email: new FormControl(null, [
				Validators.required,
				Validators.email,
				Validators.maxLength(64),
			]),
			username: new FormControl(null, [
				Validators.required,
				this.usernameValidator,
				Validators.minLength(4),
				Validators.maxLength(24),
			]),
			password: new FormControl(null, [
				Validators.required,
				Validators.minLength(6),
				Validators.maxLength(64),
			]),
		});
	}

	onSubmit() {
		const form = this.inSignUpMode ? this.signUpForm : this.signInForm;
		if (form.invalid) return;

		this.isLoading = true;
		form.disable();

		const sub = (this.inSignUpMode
			? this.authService.signUp({ ...form.value })
			: this.authService.signIn({ ...form.value })
		).subscribe(
			data => {
				// goto next page
			},
			err => {
				this.errorMessage = err;
				this.isLoading = false;
				form.enable();
			},
			() => {
				sub.unsubscribe();
			},
		);
	}

	onSignInExt(serviceName: string) {
		const authWindow = window.open(
			(environment.production ? "" : "http://localhost:3000") +
				"/auth/" +
				serviceName,
			"",
			"width=500,height=600",
		);

		this.signInForm.disable();
		this.isLoading = true;

		const interval = setInterval(() => {
			try {
				if (
					authWindow.document.URL.indexOf(
						environment.production
							? window.location.host
							: "localhost",
					) > -1
				) {
					const token = authWindow.document.head.querySelector(
						"#token",
					).innerHTML;

					clearInterval(interval);

					authWindow.close();
					//this.authService.handleAuthentication(token);
				}
			} catch (err) {}

			try {
				if (authWindow.location.href == undefined) {
					clearInterval(interval);
					this.signInForm.enable();
					this.isLoading = false;
				}
			} catch (err) {}
		}, 100);
	}

	onToggleSignUp() {
		this.errorMessage = "";
		this.inSignUpMode = !this.inSignUpMode;
	}
}
