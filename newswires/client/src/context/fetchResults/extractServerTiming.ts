import { getErrorMessage } from '@guardian/libs';

export function extractServerTiming(
	headers: Headers | undefined,
): number | undefined {
	const serverTimingHeader = headers?.get('Server-Timing');
	const serverTimingMatch = serverTimingHeader?.match(
		/total;dur=(\d+(\.\d+)?)/,
	);
	try {
		const serverTiming = serverTimingMatch
			? Number(serverTimingMatch[1])
			: undefined;
		if (Number.isNaN(serverTiming)) {
			return undefined;
		}
		return serverTiming;
	} catch (e) {
		console.error(
			`Error extracting Server-Timing from response: ${getErrorMessage(e)}`,
		);
		return undefined;
	}
}
