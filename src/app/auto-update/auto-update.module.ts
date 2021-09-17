import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import player from "lottie-web";
import { LottieModule } from "ngx-lottie";
import { MaterialModule } from "../material.module";
import { AutoUpdateComponent } from "./auto-update.component";

export function playerFactory() {
	return player;
}

const routes: Routes = [{ path: "", component: AutoUpdateComponent }];

@NgModule({
	declarations: [AutoUpdateComponent],
	imports: [
		CommonModule,
		MaterialModule,
		RouterModule.forChild(routes),
		LottieModule.forRoot({
			player: playerFactory,
		}),
	],
})
export class AutoUpdateModule {}
