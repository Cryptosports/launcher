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
	private currentDomainId: string = null;

	private timeSinceStarted: Date = null;

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
					const initialize = () => {
						let failed = false;

						this.rpc = new DiscordRPC.Client({ transport: "ipc" });
						this.rpc
							.login({
								clientId: "626510915843653638",
							})
							.catch(err => {
								console.log("failed to init");
								this.rpc == null;
								failed = true;
							})
							.then(() => {
								if (failed) return;

								if (this.currentDomainId == null) {
									this.atLauncher();
								} else {
									this.updateDomainId(
										this.currentDomainId,
										true,
									);
								}
								console.log(this.rpc);
							});
					};

					initialize();

					setInterval(() => {
						if (this.rpc.user == null) {
							initialize();
						} else {
							if (this.rpc.transport.socket.writable == false) {
								initialize();
							}
						}
					}, 1000 * 60);
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
		this.timeSinceStarted = null;

		if (this.rpc == null) return;
		this.rpc.setActivity({
			details: "Waiting at the launcher...",
		});
	}

	async updateDomainId(domainId: string, forceUpdate = false) {
		if (forceUpdate == false && this.currentDomainId == domainId) return;

		if (this.currentDomainId == null) this.timeSinceStarted = new Date();
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
								startTimestamp: this.timeSinceStarted,
							});
						} else {
							this.rpc.setActivity({
								details: json.domain.label || "",
								state: json.domain.description || "",
								largeImageKey: "header",
								smallImageKey: "logo",
								//joinSecret: this.currentDomainId,
								startTimestamp: this.timeSinceStarted,
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
