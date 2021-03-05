import { HttpClient } from "@angular/common/http";
import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { Subscription } from "rxjs";
import { skip } from "rxjs/operators";
import { AuthService } from "../../../auth/auth.service";
import { InterfaceSettingsService } from "../../interface-settings.service";
import { InterfaceService } from "../../interface.service";
import { SettingsService } from "../../settings/settings.service";
import { tutorialWorldAddress } from "../../utils";
import { World } from "./world-button/world-button.component";

@Component({
	selector: "app-world-selector",
	templateUrl: "./world-selector.component.html",
	styleUrls: ["./world-selector.component.scss"],
})
export class WorldSelectorComponent implements OnInit, OnDestroy {
	dropdownOpen = false;

	currentWorld: World;
	currentWorldState: "known" | "tutorial" | "unknown" = "known";

	latestWorlds: World[] = [];
	search = "";

	subs: Subscription[] = [];

	running = false;

	constructor(
		private readonly http: HttpClient,
		private readonly zone: NgZone,
		private readonly authService: AuthService,
		private readonly interfaceSettingsService: InterfaceSettingsService,
		public readonly settingsService: SettingsService,
		private readonly interfaceService: InterfaceService,
	) {}

	ngOnInit(): void {
		this.getCurrentWorld();
		this.getLatestWorlds();

		this.subs.push(
			this.settingsService
				.getSetting<boolean>("alwaysSpawnInTutorialWorld")
				.pipe(skip(1)) // dont need initial value
				.subscribe(() => {
					this.getCurrentWorld();
				}),
			this.interfaceService.running$.pipe(skip(1)).subscribe(running => {
				this.running = running;
				if (running == true) {
					// when opening
					this.dropdownOpen = false;
				} else {
					// when closed
					this.getCurrentWorld();
				}
			}),
			this.interfaceService.worldIdChanges$.subscribe(worldId => {
				this.zone.run(() => {
					this.getCurrentWorld(worldId);
				});
			}),
			this.interfaceService.serverlessChanges$.subscribe(address => {
				this.zone.run(() => {
					this.getCurrentWorld(null, address);
				});
			}),
		);
	}

	ngOnDestroy() {
		for (const sub of this.subs) {
			sub.unsubscribe();
		}
	}

	toggleDropdown() {
		if (this.running) return;
		if (this.dropdownOpen == false) this.getLatestWorlds();
		this.dropdownOpen = !this.dropdownOpen;
	}

	getLatestWorlds() {
		this.http
			.get<World[]>(this.authService.metaverseUrl + "/api/domains", {
				params: {
					page: "1",
					amount: "5",
					search: this.search,
				},
			})
			.subscribe(
				worlds => {
					const maxWorlds = 5;
					this.latestWorlds = worlds.slice(0, maxWorlds);

					const worldsToAdd = maxWorlds - this.latestWorlds.length;
					if (this.latestWorlds.length < maxWorlds) {
						for (let i = 0; i < worldsToAdd; i++) {
							this.latestWorlds.push({} as any);
						}
					}
				},
				() => {
					this.latestWorlds = [];
				},
			);
	}

	getCurrentWorld(overrideId?: string, overrideAddress?: string) {
		const alwaysSpawnInTutorialWorld = this.settingsService.getSetting<
			boolean
		>("alwaysSpawnInTutorialWorld").value;
		if (alwaysSpawnInTutorialWorld) {
			this.currentWorldState = "tutorial";
			return;
		}

		let id = "";

		if (overrideId != null) {
			id = overrideId;
		} else {
			let address = "";

			if (overrideAddress != null) {
				address = overrideAddress;
			} else {
				const settings = this.interfaceSettingsService.readInterfaceSettings();
				address = settings["AddressManager/address"];
			}

			if (address == null || address == "") {
				// TODO: find a better way to get the default domain
				id = "7def9d04-b4a4-1000-8000-43f7eb82caf7";
			} else {
				if (address == tutorialWorldAddress) {
					this.currentWorldState = "tutorial";
					return;
				}

				const matches = address.match(
					/(?:hifi|tivoli):\/\/([^]+?)(?:\/|$)/i,
				);
				if (matches == null) {
					this.currentWorldState = "unknown";
					return;
				}

				id = matches[1];
			}
		}

		this.http
			.get<World>(this.authService.metaverseUrl + "/api/domain/" + id)
			.subscribe(
				world => {
					this.currentWorld = world;
					this.currentWorldState = "known";
				},
				err => {
					this.currentWorld = null;
					this.currentWorldState = "unknown";
				},
			);
	}

	updateSettingChecked(key: string, event: MatSlideToggleChange) {
		this.settingsService.setSetting(key, event.checked);
	}

	updateSpawnWorld(id: string) {
		const settings = this.interfaceSettingsService.readInterfaceSettings();

		settings["AddressManager/address"] = id
			? "hifi://" + id
			: tutorialWorldAddress;

		this.interfaceSettingsService.writeInterfaceSettings(settings);
		this.getCurrentWorld();

		this.dropdownOpen = false;
	}

	onWorldSearch(search: string) {
		this.search = search.trim();
		this.getLatestWorlds();
	}
}
