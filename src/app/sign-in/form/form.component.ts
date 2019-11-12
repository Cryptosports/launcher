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

	mode: "signIn" | "signUp" | "extSignUp" = "signIn";
	isLoading = false;

	signInForm: FormGroup = null as any;
	signUpForm: FormGroup = null as any;
	extSignUpForm: FormGroup = null as any;

	extServices = ["Google", "Discord", "GitHub"];
	extEmail = "";
	extImageUrl = "";

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

		this.extSignUpForm = new FormGroup({
			username: new FormControl(null, [
				Validators.required,
				this.usernameValidator,
				Validators.minLength(4),
				Validators.maxLength(24),
			]),
			token: new FormControl(null),
			imageUrl: new FormControl(null),
		});
	}

	onSubmit() {
		let form = null;
		if (this.mode == "signIn") form = this.signInForm;
		if (this.mode == "signUp") form = this.signUpForm;
		if (this.mode == "extSignUp") form = this.extSignUpForm;
		if (form == null) return;
		if (form.invalid) return;

		let service = null;
		if (this.mode == "signIn")
			service = this.authService.signIn({ ...form.value });
		if (this.mode == "signUp")
			service = this.authService.signUp({ ...form.value });
		if (this.mode == "extSignUp")
			service = this.authService.extSignUp({ ...form.value });
		if (service == null) return;

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
			"toolbar=no,menubar=no,width=500,height=600",
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
				this.mode = "extSignUp";
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

	onToggleSignUp() {
		this.errorMessage = "";
		this.mode = this.mode == "signIn" ? "signUp" : "signIn";
	}
}
