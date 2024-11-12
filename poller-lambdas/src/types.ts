import type { IngestorInputBody } from '../../shared/types';

export type SecretValue = string; //TODO refine type

export type PollerInput = string | undefined;

export interface CorePollerOutput {
	payloadForIngestionLambda: IngestorPayload[] | IngestorPayload;
}
export type LongPollOutput = CorePollerOutput & {
	valueForNextPoll: PollerInput;
};

export type FixedFrequencyPollOutput = CorePollerOutput & {
	idealFrequencyInSeconds: number;
};

export type LongPollFunction = (
	secret: SecretValue,
	input: PollerInput,
) => Promise<LongPollOutput>;

export type FixedFrequencyPollFunction = (
	secret: SecretValue,
) => Promise<FixedFrequencyPollOutput>;

export type PollFunction = LongPollFunction | FixedFrequencyPollFunction;

export type IngestorPayload = {
	externalId: string;
	body?: IngestorInputBody;
};
