import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LaunchBarComponent } from "./launch-bar/launch-bar.component";
import { ContentComponent } from "./content/content.component";
import { LauncherComponent } from "./launcher.component";
import { Routes, RouterModule } from "@angular/router";
import { MaterialModule } from "../material.module";
import { DownloadComponent } from "./download/download.component";

const routes: Routes = [{ path: "", component: LauncherComponent }];

@NgModule({
	declarations: [
		LauncherComponent,
		LaunchBarComponent,
		ContentComponent,
		DownloadComponent,
	],
	imports: [CommonModule, MaterialModule, RouterModule.forChild(routes)],
	entryComponents: [DownloadComponent],
})
export class LauncherModule {}
