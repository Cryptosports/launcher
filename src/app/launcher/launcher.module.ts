import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { ContentComponent } from "./content/content.component";
import { LaunchBarComponent } from "./launch-bar/launch-bar.component";
import { LauncherComponent } from "./launcher.component";

const routes: Routes = [{ path: "", component: LauncherComponent }];

@NgModule({
	declarations: [LauncherComponent, LaunchBarComponent, ContentComponent],
	imports: [CommonModule, MaterialModule, RouterModule.forChild(routes)],
	entryComponents: [],
})
export class LauncherModule {}
