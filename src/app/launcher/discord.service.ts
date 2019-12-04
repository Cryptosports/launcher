import { Injectable } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { SettingsService } from "./settings/settings.service";
import { HttpClient } from "@angular/common/http";

const require = (window as any).require;
const DiscordRPC = require("discord-rpc");

@Injectable({
	providedIn: "root",
})
export class DiscordService {
	private rpc = null;
	private currentDomainId = null;

	constructor(
		private authService: AuthService,
		private settingsService: SettingsService,
		private http: HttpClient,
	) {}

	initialize() {
		this.settingsService
			.getSetting("discordRichPresence")
			.subscribe(enabled => {
				if (enabled) {
					this.rpc = new DiscordRPC.Client({ transport: "ipc" });
					this.rpc
						.login({
							clientId: "626510915843653638",
						})
						.catch(err => {})
						.then(() => {
							this.atLauncher();
						});
				} else {
					if (this.rpc != null) {
						this.rpc.destroy();
						this.rpc = null;
					}
				}
			});
	}

	atLauncher() {
		this.currentDomainId = null;

		if (this.rpc == null) return;
		this.rpc.setActivity({
			details: "Waiting at the launcher...",
		});
	}

	async updateDomainId(domainId: string) {
		if (this.currentDomainId == domainId) return;
		this.currentDomainId = domainId;

		if (this.rpc == null) return;
		if (this.rpc.user == null) return;
		try {
			const sub = this.http
				.get<{
					status: "success" | "fail";
					domain: {
						label: string;
						description: string;
						restriction: "open" | "hifi" | "acl";
					};
				}>(
					this.authService.metaverseUrl +
						"/api/v1/domains/" +
						this.currentDomainId,
				)
				.subscribe(
					json => {
						if (json.status != "success")
							return this.rpc.clearActivity({});

						if (json.domain.restriction == "acl") {
							this.rpc.setActivity({
								details: "Private domain",
								largeImageKey: "header",
								smallImageKey: "logo",
								startTimestamp: new Date(),
							});
						} else {
							this.rpc.setActivity({
								details: json.domain.label || "",
								state: json.domain.description || "",
								largeImageKey: "header",
								smallImageKey: "logo",
								//joinSecret: this.currentDomainId,
								startTimestamp: new Date(),
							});
						}
					},
					err => {
						this.rpc.clearActivity({});
					},
					() => {
						sub.unsubscribe();
					},
				);
		} catch (err) {
			try {
				this.rpc.clearActivity({});
			} catch (err) {}
		}
	}
}
