import { HttpClient } from "@angular/common/http";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AuthService } from "../../../../auth/auth.service";
import { displayPlural } from "../../../utils";

export interface World {
	id: string;
	_id: string;
	label: string;
	username: string;
	author: string;
	description: string;
	restriction: "hifi" | "open" | "acl";
	maturity: string;
	online: boolean;
	numUsers: number;
	likes: number;
	liked: boolean;
	iceServerAddress: string;
	networkAddress: string;
	networkPort: number;
	protocol: string;
	version: string;
	path: string;
	url: string;
}

@Component({
	selector: "app-world-button",
	templateUrl: "./world-button.component.html",
	styleUrls: ["./world-button.component.scss"],
})
export class WorldButtonComponent implements OnInit {
	readonly displayPlural = displayPlural;

	readonly metaverseUrl = this.authService.metaverseUrl;

	@Input() world: World;
	@Input() state: "known" | "tutorial" | "unknown" = "known";

	@Input() dark = false;
	@Input() disabled = false;

	constructor(private readonly authService: AuthService) {}

	ngOnInit(): void {}
}
