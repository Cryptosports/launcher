import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { ChangelogComponent } from "./changelog/changelog.component";
import { HomeComponent } from "./home/home.component";
import { LaunchBarComponent } from "./launch-bar/launch-bar.component";
import { LauncherComponent } from "./launcher.component";
import { SettingsComponent } from "./settings/settings.component";
import { TokboxSettingsComponent } from "./tokbox-stream/tokbox-settings/tokbox-settings.component";
import { TokboxStreamComponent } from "./tokbox-stream/tokbox-stream.component";
import { VideoStreamComponent } from "./video-stream/video-stream.component";

const routes: Routes = [
	{
		path: "",
		component: LauncherComponent,
		children: [
			{ path: "home", component: HomeComponent },
			{ path: "changelog", component: ChangelogComponent },
			{ path: "settings", component: SettingsComponent },
			{ path: "video-stream", component: VideoStreamComponent },
			{ path: "tokbox-stream", component: TokboxStreamComponent },
		],
	},
];

@NgModule({
	declarations: [
		LauncherComponent,
		LaunchBarComponent,
		HomeComponent,
		VideoStreamComponent,
		SettingsComponent,
		TokboxStreamComponent,
		TokboxSettingsComponent,
		ChangelogComponent,
	],
	imports: [CommonModule, MaterialModule, RouterModule.forChild(routes)],
	entryComponents: [TokboxSettingsComponent],
})
export class LauncherModule {}
