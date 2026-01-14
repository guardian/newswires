// FIXME we should probably have a dedicated stack for the Newswires app for e.g. cost explorer purposes (as the App tag needs to be different for riff-raff etc. to differentiate)
export const STACK = 'editorial-feeds';

export const SUCCESSFUL_INGESTION_EVENT_TYPE = 'INGESTION_SUCCESS';
export const FAILED_INGESTION_EVENT_TYPE = 'INGESTION_FAILURE';
export const INGESTION_DUPLICATE_STORY_EVENT_TYPE = 'INGESTION_DUPLICATE_STORY';
export const INGESTION_PROCESSING_SQS_MESSAGE_EVENT_TYPE =
	'INGESTION_PROCESSING_SQS_MESSAGE';
export const INGESTION_HEARTBEAT = 'INGESTION_HEARTBEAT';
export const POLLER_FAILURE_EVENT_TYPE = 'POLLER_FAILURE';
export const POLLER_INVOCATION_EVENT_TYPE = 'POLLER_INVOCATION';

export const DATABASE_TABLE_NAME = 'fingerpost_wire_entry';
