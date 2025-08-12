import type { IUserTelemetryEvent } from '@guardian/user-telemetry-client';
import { UserTelemetryEventSender } from '@guardian/user-telemetry-client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod/v4';
import { loadOrSetInLocalStorage } from './context/localStorage';

export type TelemetryEventSender = (
	type: string,
	tags?: IUserTelemetryEvent['tags'],
	value?: boolean | number,
) => void;

export function getTelemetryUrl(stage: string): string {
	const telemetryDomain =
		stage === 'PROD' ? 'gutools.co.uk' : 'code.dev-gutools.co.uk';
	return `https://user-telemetry.${telemetryDomain}`;
}

export const createTelemetryEventSender = ({
	stage,
	sendTelemetryAsDev,
	gitCommitId,
}: {
	stage: string;
	sendTelemetryAsDev: boolean;
	gitCommitId: string;
}) => {
	const telemetryUrl = getTelemetryUrl(stage);
	const telemetryEventService = new UserTelemetryEventSender(telemetryUrl, 100);

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
		const isDevUser = sendTelemetryAsDev;

		const event = {
			app: 'newswires',
			stage: stage,
			eventTime: new Date().toISOString(),
			gitCommitId,
			type,
			value,
			tags: { ...tags, browserUUID, isDevUser },
		};
		telemetryEventService.addEvent(event);
	};

	return { sendTelemetryEvent };
};
