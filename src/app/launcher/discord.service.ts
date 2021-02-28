import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { SettingsService } from "./settings/settings.service";

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
		private readonly authService: AuthService,
		private readonly settingsService: SettingsService,
		private readonly http: HttpClient,
	) {}

	initialize() {
		const initializeRpc = () => {
			let failed = false;

			this.rpc = new DiscordRPC.Client({ transport: "ipc" });
			this.rpc
				.login({
					clientId: "626510915843653638",
				})
				.catch(err => {
					console.error(err);
					this.rpc == null;
					failed = true;
				})
				.then(() => {
					if (failed) return;

					if (this.currentDomainId == null) {
						this.atLauncher();
					} else {
						this.updateDomainId(this.currentDomainId, true);
					}
					console.log(this.rpc);
				});
		};

		this.settingsService
			.getSetting("discordRichPresence")
			.subscribe(enabled => {
				if (enabled) {
					initializeRpc();

					setInterval(() => {
						if (this.rpc.user == null) {
							initializeRpc();
						} else {
							if (this.rpc.transport.socket.writable == false) {
								initializeRpc();
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
		// this.rpc.setActivity({
		// 	details: "Waiting at the launcher...",
		// });
		this.rpc.clearActivity();
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
								details: "🔒 In a private world",
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
