import type { IUserTelemetryEvent } from '@guardian/user-telemetry-client';
import { UserTelemetryEventSender } from '@guardian/user-telemetry-client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { loadOrSetInLocalStorage } from './context/localStorage';

export type TelemetryEventSender = (
	type: string,
	tags?: IUserTelemetryEvent['tags'],
	value?: boolean | number,
) => void;

export const createTelemetryEventSender = (stage: string) => {
	const telemetryDomain =
		stage === 'PROD' ? 'gutools.co.uk' : 'code.dev-gutools.co.uk';

	const telemetryEventService = new UserTelemetryEventSender(
		`https://user-telemetry.${telemetryDomain}`,
		100,
	);

	const sendTelemetryEvent: TelemetryEventSender = (
		type: string,
		tags?: IUserTelemetryEvent['tags'],
		value: boolean | number = true,
	) => {
		const browserUUID = loadOrSetInLocalStorage(
			'browserUUID',
			z.string(),
			uuidv4(),
		);

		const event = {
			app: 'newswires',
			stage: stage,
			eventTime: new Date().toISOString(),
			type,
			value,
			tags: { ...tags, browserUUID },
		};
		telemetryEventService.addEvent(event);
	};

	return { sendTelemetryEvent };
};
