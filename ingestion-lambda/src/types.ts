import type { IngestorInputBody } from '../../shared/types';

export type ProcessedMessageData = {
	externalId: string;
	objectKey: string;
	sqsMessageId: string;
};

export type ProcessedObject = {
	content: IngestorInputBody;
	supplier: string;
	categoryCodes: string[];
};

export type OperationFailure = {
	status: 'failure';
	reason: string;
};

type BaseOperationSuccess = {
	status: 'success';
};

export type OperationSuccess<T> = BaseOperationSuccess & T;

export type NoExtraData = Record<string, never>;

export type OperationResult<T> = OperationFailure | OperationSuccess<T>;

export type BatchItemFailure = OperationFailure & {
	sqsMessageId: string;
};

export type BatchItemResult = BaseOperationSuccess | BatchItemFailure;
