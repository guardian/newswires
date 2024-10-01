// timestamp string of format: 2024-09-24T14:22:07.603Z to HH:MM:ss
// or if the date is not today, return the date in the format: 25/09/2024, 14:22:07
// (these are the formats for UK locale)
export function formatTimestamp(s: string) {
	const date = new Date(s);
	const now = new Date();
	if (now.getDate() === date.getDate()) {
		return date.toLocaleTimeString();
	}
	return date.toLocaleString();
}
