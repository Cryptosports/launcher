import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes } from "@angular/router";
import { AppComponent } from "./app.component";
import { AuthInterceptorService } from "./auth/auth-interceptor";
import { VerifyEmailComponent } from "./auth/verify-email/verify-email.component";
import { MaterialModule } from "./material.module";
import { MediaStreamPickerComponent } from "./media-stream-picker/media-stream-picker.component";
import { UpdateAvailableComponent } from "./update-available/update-available.component";

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
