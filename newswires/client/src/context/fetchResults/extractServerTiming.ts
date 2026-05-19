import { getErrorMessage } from '@guardian/libs';

export function extractServerTiming(
	headers: Headers | undefined,
): number | undefined {
	const serverTimingHeader = headers?.get('Server-Timing');
	const serverTimingMatch = serverTimingHeader?.match(
		/total;dur=(\d+(\.\d+)?)/,
	);
	try {
		if (!serverTimingMatch) return undefined;
		const serverTiming = Number(serverTimingMatch[1]);
		if (Number.isNaN(serverTiming)) return undefined;
		return serverTiming;
	} catch (e) {
		console.error(
			`Error extracting Server-Timing from response: ${getErrorMessage(e)}`,
		);
		return undefined;
	}
}
