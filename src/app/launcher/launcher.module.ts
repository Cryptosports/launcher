import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { HomeComponent } from "./home/home.component";
import { LaunchBarComponent } from "./launch-bar/launch-bar.component";
import { LauncherComponent } from "./launcher.component";
import { VideoStreamComponent } from "./video-stream/video-stream.component";
import { OpeningPopupComponent } from "./opening-popup/opening-popup.component";

const routes: Routes = [
	{
		path: "",
		component: LauncherComponent,
		children: [
			{ path: "home", component: HomeComponent },
			{ path: "video-stream", component: VideoStreamComponent },
		],
	},
];

@NgModule({
	declarations: [
		LauncherComponent,
		LaunchBarComponent,
		HomeComponent,
		VideoStreamComponent,
		OpeningPopupComponent,
	],
	imports: [CommonModule, MaterialModule, RouterModule.forChild(routes)],
	entryComponents: [OpeningPopupComponent],
})
export class LauncherModule {}
