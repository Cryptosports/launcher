import { ClipboardModule } from "@angular/cdk/clipboard";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { ChangelogComponent } from "./changelog/changelog.component";
import { CrashDialogComponent } from "./crash-dialog/crash-dialog.component";
import { DeveloperComponent } from "./developer/developer.component";
import { HomeComponent } from "./home/home.component";
import { LaunchBarComponent } from "./launch-bar/launch-bar.component";
import { LaunchButtonComponent } from "./launch-bar/launch-button/launch-button.component";
import { WorldButtonComponent } from "./launch-bar/world-selector/world-button/world-button.component";
import { WorldSelectorComponent } from "./launch-bar/world-selector/world-selector.component";
import { LauncherComponent } from "./launcher.component";
import { LogsComponent } from "./logs/logs.component";
import { OldLauncherComplainDialogComponent } from "./old-launcher-complain-dialog/old-launcher-complain-dialog.component";
import { SettingsComponent } from "./settings/settings.component";
import { TokboxSettingsComponent } from "./tokbox-stream/tokbox-settings/tokbox-settings.component";
import { TokboxStreamComponent } from "./tokbox-stream/tokbox-stream.component";
import { VideoStreamComponent } from "./video-stream/video-stream.component";
import { WorldServerComponent } from "./world-server/world-server.component";

const routes: Routes = [
	{
		path: "",
		component: LauncherComponent,
		children: [
			{ path: "home", component: HomeComponent },
			{ path: "changelog", component: ChangelogComponent },
			{ path: "developer", component: DeveloperComponent },
			{ path: "logs", component: LogsComponent },
			{ path: "world-server", component: WorldServerComponent },
			{ path: "settings", component: SettingsComponent },
			// { path: "video-stream", component: VideoStreamComponent },
			// { path: "tokbox-stream", component: TokboxStreamComponent },
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
		DeveloperComponent,
		LogsComponent,
		WorldServerComponent,
		CrashDialogComponent,
		LaunchButtonComponent,
		WorldButtonComponent,
		WorldSelectorComponent,
		OldLauncherComplainDialogComponent,
	],
	imports: [
		CommonModule,
		MaterialModule,
		RouterModule.forChild(routes),
		ScrollingModule,
		ClipboardModule,
	],
	entryComponents: [
		TokboxSettingsComponent,
		CrashDialogComponent,
		OldLauncherComplainDialogComponent,
	],
})
export class LauncherModule {}
