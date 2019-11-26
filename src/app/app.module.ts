import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes } from "@angular/router";
import { AppComponent } from "./app.component";
import { UpdateAvailableComponent } from "./update-available/update-available.component";
import { MaterialModule } from "./material.module";

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
	declarations: [AppComponent, UpdateAvailableComponent],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MaterialModule,
		HttpClientModule,
		RouterModule.forRoot(routes),
	],
	entryComponents: [UpdateAvailableComponent],
	bootstrap: [AppComponent],
})
export class AppModule {}
