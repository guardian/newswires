export function decideEmbargoNote({
	status,
	embargo,
}: {
	status: string | undefined;
	embargo: string | undefined;
}): string | undefined {
	if (status === 'withheld' && embargo) {
		const embargoDate = new Date(embargo);
		if (embargoDate.toString() === 'Invalid Date') {
			console.error(`Error parsing embargo date: ${embargo}.`);
			return `Embargoed until ${embargo}. Note: embargo date is in an unrecognized format. Please check the date string manually and flag this issue to a developer if necessary.`;
		} else {
			return `Embargoed until ${embargoDate.toLocaleString(undefined, { timeZoneName: 'short' })}`;
		}
	} else {
		return undefined;
	}
}
