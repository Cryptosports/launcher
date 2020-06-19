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
	loading = true;

	ngOnInit() {
		const iframe = this.iframe.nativeElement;

		const styles: [string, string][] = [
			// remove header
			[".md-header", "display: none !important"],
			// remove title
			[".md-content h1#changelog", "display: none !important"],
			// remove title links
			[".md-content .headerlink", "display: none !important"],
			// move content up
			[".md-content", "margin-top: -120px"],
			// remove footer
			[".md-footer", "display: none !important"],
			// remove last update
			[".md-content hr", "display: none !important"],
			[".md-content .md-source-date", "display: none !important"],
		];

		this.interval = setInterval(() => {
			try {
				let css = "html{background:#fff!important}";

				for (const style of styles) {
					if (
						iframe.contentDocument.querySelector<HTMLDivElement>(
							style[0],
						) == null
					)
						throw new Error(style[0] + " not found");

					css += style[0] + "{" + style[1] + "}";
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
				// console.error(err);
			}
		}, 100);
	}

	ngOnDestroy() {
		if (this.interval) clearInterval(this.interval);
	}
}
