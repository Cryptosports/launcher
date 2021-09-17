import { Component, NgZone, OnDestroy } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { Subscription } from "rxjs";
import { AnimationOptions } from "ngx-lottie";
import { filter, take } from "rxjs/operators";

const require = (window as any).require;

const electron = require("electron");
const express = require("express");
const getPort = require("get-port");

@Component({
	selector: "app-sign-in",
	templateUrl: "./sign-in.component.html",
	styleUrls: ["./sign-in.component.scss"],
})
export class SignInComponent implements OnDestroy {
	expressServer = null;
	expressPort = null;

	autoLoggingInSub: Subscription = null;

	logoOptions: AnimationOptions = {
		path: "./assets/tivoli-loading.json",
		renderer: "svg",
		loop: true,
		autoplay: true,
	};

	constructor(
		private readonly authService: AuthService,
		private readonly zone: NgZone,
	) {
		this.autoLoggingInSub = this.authService.autoLoggingIn$
			.pipe(filter(autoLoggingIn => autoLoggingIn == false))
			.subscribe(async () => {
				if (this.expressServer) this.expressServer.close();

				const app = express();

				app.get("/signIn", (req, res) => {
					res.send(
						"<script>setInterval(()=>{window.close();},100);window.close();</script>",
					);
					this.zone.run(() => {
						this.authService.handleAuthentication(
							JSON.parse(req.query.token),
						);
						electron.ipcRenderer.invoke("force-show");
					});
				});

				this.expressPort = await getPort();
				this.expressServer = app.listen(this.expressPort, "127.0.0.1");

				this.nothingIsHappening();
			});

		this.authService.autoLogin();
	}

	nothingIsHappening() {
		if (this.expressPort == null) {
			// not good
		} else {
			electron.shell.openExternal(
				this.authService.metaverseUrl +
					"?launcherSignInPort=" +
					this.expressPort,
			);
		}
	}

	ngOnDestroy() {
		if (this.autoLoggingInSub) this.autoLoggingInSub.unsubscribe();
		if (this.expressServer) this.expressServer.close();
	}
}
