import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AuthService, AuthToken } from "../../auth/auth.service";

const electron = (window as any).require("electron");

@Component({
	selector: "app-form",
	templateUrl: "./form.component.html",
	styleUrls: ["./form.component.scss"],
})
export class FormComponent implements OnInit {
	errorMessage = "";

	isLoading = false;
	isExtSignUp = false;

	signInForm: FormGroup;
	extSignUpForm: FormGroup;

	extServices = ["Google", "Discord", "GitHub"];
	extEmail = "";
	extImageUrl = "";

	constructor(public authService: AuthService) {}

	usernameValidator(control: FormControl): { [s: string]: boolean } | null {
		let value: string = control.value + "";

		if (!/^[a-zA-Z0-9\_]+$/.test(value)) return { badCharacters: true };

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

		this.extSignUpForm = new FormGroup({
			username: new FormControl(null, [
				Validators.required,
				this.usernameValidator,
				Validators.minLength(4),
				Validators.maxLength(16),
			]),
			token: new FormControl(null),
			imageUrl: new FormControl(null),
		});
	}

	onSubmit() {
		const form = this.isExtSignUp ? this.extSignUpForm : this.signInForm;
		if (form.invalid) return;

		const service = this.isExtSignUp
			? this.authService.extSignUp(form.value)
			: this.authService.signIn(form.value);

		this.isLoading = true;
		form.disable();

		const sub = service.subscribe(
			data => {},
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
			this.authService.metaverseUrl + "/api/auth/" + serviceName,
			"",
			"toolbar=no,menubar=no,width=500,height=600,useragent=Cr",
		);

		this.signInForm.disable();
		this.isLoading = true;

		const handleMessage = (e: MessageEvent) => {
			if (e.origin != this.authService.metaverseUrl) return;
			window.removeEventListener("message", handleMessage);
			authWindow.close();

			const { token, register } = e.data as {
				token: AuthToken;
				register: {
					token: string;
					username: string;
					email: string;
					imageUrl: string;
				};
			};

			if (token != null) {
				this.authService.handleAuthentication(token);
				return;
			}

			if (register != null) {
				this.extSignUpForm.controls.token.setValue(register.token);
				this.extSignUpForm.controls.username.setValue(
					register.username,
				);
				if (register.imageUrl)
					this.extSignUpForm.controls.imageUrl.setValue(
						register.imageUrl,
					);

				this.extEmail = register.email;
				this.extImageUrl = register.imageUrl;

				this.isLoading = false;

				this.errorMessage = "";
				this.isExtSignUp = true;
				return;
			}
		};

		window.addEventListener("message", handleMessage);

		const onClosedInterval = setInterval(() => {
			if (authWindow.closed) {
				clearInterval(onClosedInterval);
				this.signInForm.enable();
				this.isLoading = false;
			}
		}, 100);
	}

	onSignUp() {
		(window as any)
			.require("electron")
			.shell.openExternal(this.authService.metaverseUrl + "?signUp");
	}

	onResetPassword() {
		(window as any)
			.require("electron")
			.shell.openExternal(
				this.authService.metaverseUrl + "?forgotPassword",
			);
	}
}
