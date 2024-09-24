// timestamp string of format: 2024-09-24T14:22:07.603Z to HH:MM:ss
export function formatTimestamp(s: string) {
	const date = new Date(s);
	return date.toLocaleTimeString();
}
