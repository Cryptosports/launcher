import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes } from "@angular/router";
import { AppComponent } from "./app.component";

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
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		HttpClientModule,
		RouterModule.forRoot(routes),
	],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
