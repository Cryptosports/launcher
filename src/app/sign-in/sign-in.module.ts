import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { FormComponent } from "./form/form.component";
import { SignInComponent } from "./sign-in.component";

const routes: Routes = [{ path: "", component: SignInComponent }];

@NgModule({
	declarations: [SignInComponent, FormComponent],
	imports: [
		CommonModule,
		MaterialModule,
		ReactiveFormsModule,
		RouterModule.forChild(routes),
	],
})
export class SignInModule {}
