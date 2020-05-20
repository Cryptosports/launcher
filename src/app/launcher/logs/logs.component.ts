import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { take } from "rxjs/operators";
import { InterfaceService } from "../interface.service";

@Component({
	selector: "app-logs",
	templateUrl: "./logs.component.html",
	styleUrls: ["./logs.component.scss"],
})
export class LogsComponent implements OnInit, OnDestroy {
	logs = new BehaviorSubject<[string, string, string, string][]>([]);

	subs: Subscription[] = [];

	@ViewChild("viewport") private viewport: CdkVirtualScrollViewport;

	constructor(private readonly interfaceService: InterfaceService) {}

	getClipboard() {
		return this.interfaceService.logs.join("\n");
	}

	transformAndAddLog(line: string) {
		let color = "";
		if (/WARNING/.test(line)) color = "#fff8e1"; // amber 50
		if (/ERROR/.test(line)) color = "#ffebee"; // red 50

		let monospace = "";
		try {
			monospace = line.match(/((?:\[[^]*?\] )+)/)[1];
		} catch (err) {}
		line = line.replace(monospace, "");

		let date = "";
		try {
			date = monospace.match(
				/(^\[[0-9]{2}\/[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\])/i,
			)[1];
		} catch (err) {}
		monospace = monospace.replace(date, "");

		this.logs.pipe(take(1)).subscribe(logs => {
			logs.push([color, date, monospace, line]);
			this.logs.next(logs);
		});

		this.scrollToBottom();
	}

	scrollToBottom(force = false) {
		if (this.viewport == null) return false;

		if (this.viewport.measureScrollOffset("bottom") < 128 || force) {
			this.viewport.scrollTo({
				bottom: 0,
				left: 0,
			});
			setTimeout(() => {
				this.viewport.scrollTo({
					bottom: 0,
					left: 0,
				});
			}, 50);
			return true;
		}
	}

	ngOnInit() {
		for (const line of this.interfaceService.logs) {
			this.transformAndAddLog(line);
		}

		this.subs.push(
			this.interfaceService.log$.subscribe(line => {
				if (line == "CLEAR_LOGS") {
					this.logs.next([]);
				} else {
					this.transformAndAddLog(line);
				}
			}),
		);

		const interval = setInterval(() => {
			if (this.scrollToBottom(true) == true) {
				clearInterval(interval);
			}
		}, 100);
	}

	ngOnDestroy() {
		for (const sub of this.subs) {
			sub.unsubscribe();
		}
	}
}
