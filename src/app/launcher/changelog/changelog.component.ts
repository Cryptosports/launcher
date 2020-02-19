import {
	Component,
	OnInit,
	ViewChild,
	ElementRef,
	OnDestroy,
} from "@angular/core";

@Component({
	selector: "app-changelog",
	templateUrl: "./changelog.component.html",
	styleUrls: ["./changelog.component.scss"],
})
export class ChangelogComponent implements OnInit, OnDestroy {
	@ViewChild("iframe", { static: true })
	iframe: ElementRef<HTMLIFrameElement>;

	constructor() {}

	private interval: any;
	private loading = true;

	ngOnInit() {
		const iframe = this.iframe.nativeElement;

		const styles: [string, string][] = [
			// remove header
			[
				"[class*='-body-'] [class*='-header-']",
				"display: none !important",
			],
			// remove page header
			[
				"[class*='-wholeContent-'] [class*='-pageHeader-']",
				"display: none !important",
			],
			// add padding to content
			[
				"[class*='-wholeContent-'] [class*='-pageContainer-']",
				"padding-top: 20px !important",
			],
			// remove padding from header
			[
				"[class*='-wholeContent-'] [class*='-wholeContentBody-']",
				"padding-top: 0 !important",
			],
			// remove anchor tag from title headers
			// [
			// 	"[class*='-wholeContent-'] [class*='blockHeadingAnchor-']",
			// 	"display: none !important",
			// ],
			// [
			// 	"[class*='-wholeContent-'] [class*='-blockHeadingAnchorHidden-']",
			// 	"display: none !important",
			// ],
			// remove left sidebar
			[
				"[class*='-wholeContent-'] [class*='-contentNavigation-']",
				"display: none !important",
			],
			// remove right sidebar
			[
				"[class*='-wholeContent-'] [class*='-pageSide-']",
				"display: none !important",
			],
			// remove right sidebar button
			[
				"[class*='-wholeContent-'] [class*='-pageHeaderToolbar-']",
				"display: none !important",
			],
			// remove footer
			[
				"[class*='-wholeContent-'] [class*='-pageFooter-']",
				"display: none !important",
			],
		];

		this.interval = setInterval(() => {
			try {
				let css = "html{background:#fff!important}";

				for (const style of styles) {
					const className = iframe.contentDocument.querySelector<
						HTMLDivElement
					>(style[0]).className;

					css += "." + className + "{" + style[1] + "}";
				}

				const styleEl = iframe.contentDocument.createElement("style");
				styleEl.innerHTML = css;
				iframe.contentDocument.body.appendChild(styleEl);

				this.iframe.nativeElement.style.height =
					iframe.contentDocument.body.scrollHeight + "px";

				this.loading = false;
				clearInterval(this.interval);
				this.interval = null;
			} catch (err) {
				//console.log(err);
			}
		}, 100);
	}

	ngOnDestroy() {
		if (this.interval) clearInterval(this.interval);
	}
}
