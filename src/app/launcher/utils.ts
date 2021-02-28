export function displayMinutes(mins: number): string {
	if (mins >= 60) {
		let hours = Math.floor(mins / 60);
		mins = mins - hours * 60;

		return (
			displayPlural(hours, "hour") + " " + displayPlural(mins, "minute")
		);
	} else {
		return mins + (mins == 1 ? " minute" : " minutes");
	}
}

export function displayPlural(n: number, singular: string, plural?: string) {
	return (
		n + " " + (n == 1 ? singular : plural != null ? plural : singular + "s")
	);
}

export const tutorialWorldAddress = "file:///~/serverless/tutorial.json";
