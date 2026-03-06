import { decideRefreshMessage } from './RefreshBanner';

const timeA = new Date('2024-01-01T10:00:00.000Z');
const timeB = new Date('2024-01-01T11:00:00.000Z');
const timeC = new Date('2024-01-01T12:00:00.000Z');
const timeD = new Date('2024-01-01T13:00:00.000Z');

describe('decideRefreshMessage', () => {
	it('should return the message if the page was loaded before the "from" time and there is no "until" time', () => {
		const result = decideRefreshMessage({
			timeThatPageWasLoaded: timeA.getTime(),
			now: timeC.getTime(),
			messageFromServer: {
				message: 'Page is stale',
				from: timeB.toISOString(),
			},
		});
		expect(result).toBe('Page is stale');
	});

	it('should return the message if the page was loaded before "from" and now is between "from" and "until"', () => {
		const result = decideRefreshMessage({
			timeThatPageWasLoaded: timeA.getTime(),
			now: timeC.getTime(),
			messageFromServer: {
				message: 'Page is stale',
				from: timeB.toISOString(),
				until: timeD.toISOString(),
			},
		});
		expect(result).toBe('Page is stale');
	});

	it('should return undefined if the page was loaded before the "from" time, but "now" is *also* before the "from" time', () => {
		const result = decideRefreshMessage({
			timeThatPageWasLoaded: timeA.getTime(),
			now: timeA.getTime(),
			messageFromServer: {
				message: 'Page is stale',
				from: timeB.toISOString(),
				until: timeD.toISOString(),
			},
		});
		expect(result).toBeUndefined();
	});

	it('should return undefined if the page was loaded after the "from" time', () => {
		const result = decideRefreshMessage({
			timeThatPageWasLoaded: timeB.getTime(),
			now: timeC.getTime(),
			messageFromServer: {
				message: 'Page is stale',
				from: timeA.toISOString(),
				until: timeD.toISOString(),
			},
		});
		expect(result).toBeUndefined();
	});

	it('should return undefined if the current time is after the "until" time', () => {
		const result = decideRefreshMessage({
			timeThatPageWasLoaded: timeA.getTime(),
			now: timeC.getTime(),
			messageFromServer: {
				message: 'Page is stale',
				from: timeB.toISOString(),
				until: timeC.toISOString(),
			},
		});
		expect(result).toBeUndefined();
	});

	it('should return undefined if there is no message from the server', () => {
		const result = decideRefreshMessage({
			timeThatPageWasLoaded: timeA.getTime(),
			now: timeA.getTime(),
			messageFromServer: undefined,
		});
		expect(result).toBeUndefined();
	});

	it('should return undefined if the message from the server indicates there is no message', () => {
		const result = decideRefreshMessage({
			timeThatPageWasLoaded: timeA.getTime(),
			now: timeA.getTime(),
			messageFromServer: { hasMessage: false },
		});
		expect(result).toBeUndefined();
	});
});
