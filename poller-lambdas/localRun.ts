import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { pollers } from './src';

const { apPoller } = pollers;

const apPollerRecord: SQSRecord = {
	messageId: '12345',
	body: 'https://api.ap.org/media/v-preview/content/feed?page_size=10&in_my_plan=true',
	messageAttributes: {
		'Message-Id': { stringValue: 'AP_POLLER_LOCAL_RUN', dataType: 'String' },
	},
} as unknown as SQSRecord;

const dummyEvent: SQSEvent = {
	Records: [apPollerRecord],
};

apPoller(dummyEvent).then(console.log).catch(console.error);
