import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { SignInComponent } from "./sign-in.component";
import { LottieModule } from "ngx-lottie";
import player from "lottie-web";

export function playerFactory() {
	return player;
}

const routes: Routes = [{ path: "", component: SignInComponent }];

@NgModule({
	declarations: [SignInComponent],
	imports: [
		CommonModule,
		MaterialModule,
		RouterModule.forChild(routes),
		LottieModule.forRoot({
			player: playerFactory,
		}),
	],
})
export class SignInModule {}
