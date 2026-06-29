import z from 'zod/v4';

export const RefreshMessageSchema = z.union([
	z.object({
		message: z.string(),
		from: z.string(),
		until: z.string().optional(),
	}),
	z.object({ hasMessage: z.literal(false) }),
]);

export type RefreshMessage = z.infer<typeof RefreshMessageSchema>;

export function decideRefreshMessage({
	timeThatPageWasLoaded,
	now,
	messageFromServer,
}: {
	timeThatPageWasLoaded: number;
	now: number;
	messageFromServer: RefreshMessage | undefined;
}): string | undefined {
	if (messageFromServer === undefined || 'hasMessage' in messageFromServer) {
		return undefined;
	}
	const { message, from, until } = messageFromServer;
	const fromTime = new Date(from).getTime();
	if (
		timeThatPageWasLoaded < fromTime &&
		now >= fromTime &&
		(!until || now < new Date(until).getTime())
	) {
		return message;
	}
	return undefined;
}
