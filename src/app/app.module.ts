import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { ErrorHandler, Injectable, NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes } from "@angular/router";
import * as Sentry from "@sentry/browser";
import { environment } from "../environments/environment";
import { AppComponent } from "./app.component";
import { AuthInterceptorService } from "./auth/auth-interceptor";
import { VerifyEmailComponent } from "./auth/verify-email/verify-email.component";
import { MaterialModule } from "./material.module";
import { MediaStreamPickerComponent } from "./media-stream-picker/media-stream-picker.component";
import { UpdateAvailableComponent } from "./update-available/update-available.component";

Sentry.init({
	dsn: "https://59d159ce1c03480d8c13f00d5d5ede3b@sentry.tivolicloud.com/2",
	environment: "production",
	enabled: environment.production,
});

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
	constructor() {}
	handleError(error) {
		const eventId = Sentry.captureException(error.originalError || error);
		Sentry.showReportDialog({ eventId });
	}
}

const routes: Routes = [
	{
		path: "",
		loadChildren: () =>
			import("./sign-in/sign-in.module").then(m => m.SignInModule),
	},
	{
		path: "launcher",
		loadChildren: () =>
			import("./launcher/launcher.module").then(m => m.LauncherModule),
	},
];

@NgModule({
	declarations: [
		AppComponent,
		UpdateAvailableComponent,
		MediaStreamPickerComponent,
		VerifyEmailComponent,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MaterialModule,
		HttpClientModule,
		ReactiveFormsModule,
		RouterModule.forRoot(routes),
	],
	providers: [
		{
			provide: ErrorHandler,
			useClass: SentryErrorHandler,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptorService,
			multi: true,
		},
	],
	entryComponents: [
		UpdateAvailableComponent,
		MediaStreamPickerComponent,
		VerifyEmailComponent,
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
