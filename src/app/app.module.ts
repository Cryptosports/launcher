import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes } from "@angular/router";
import { AppComponent } from "./app.component";
import { MaterialModule } from "./material.module";
import { UpdateAvailableComponent } from "./update-available/update-available.component";
import { MediaStreamPickerComponent } from "./media-stream-picker/media-stream-picker.component";
import { AuthInterceptorService } from "./auth/auth-interceptor";

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
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MaterialModule,
		HttpClientModule,
		RouterModule.forRoot(routes),
	],
	providers: [
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptorService,
			multi: true,
		},
	],
	entryComponents: [UpdateAvailableComponent, MediaStreamPickerComponent],
	bootstrap: [AppComponent],
})
export class AppModule {}
