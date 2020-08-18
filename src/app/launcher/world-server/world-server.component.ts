import { Component, OnInit } from "@angular/core";
import { WorldServerService } from "../world-server.service";

@Component({
	selector: "app-world-server",
	templateUrl: "./world-server.component.html",
	styleUrls: ["./world-server.component.scss"],
})
export class WorldServerComponent implements OnInit {
	readonly electron = (window as any).require("electron");

	constructor(public readonly worldServerService: WorldServerService) {}

	ngOnInit(): void {}

	isOnline(name: string) {
		return (
			this.worldServerService.processes &&
			this.worldServerService.processes[name] &&
			this.worldServerService.processes[name].stopped == false
		);
	}

	openAdminPage() {
		this.electron.shell.openExternal("http://127.0.0.1:40100/settings");
	}
}
