import type { Logger } from '../../shared/lambda-logging';
import type { IngestorInputBody } from '../../shared/types';

export type SecretValue = string;

export type PollerInput = string;

export interface CorePollerOutput {
	payloadForIngestionLambda: IngestorPayload[] | IngestorPayload;
	valueForNextPoll: PollerInput;
	newSecretValue?: SecretValue;
}
export type LongPollOutput = CorePollerOutput;

export type FixedFrequencyPollOutput = CorePollerOutput & {
	/**
	 * Should not be below 5 seconds (if so it will be rounded up to 5s anyway).
	 * */
	idealFrequencyInSeconds: number;
};

export const isFixedFrequencyPollOutput = (
	output: LongPollOutput | FixedFrequencyPollOutput,
): output is FixedFrequencyPollOutput => 'idealFrequencyInSeconds' in output;

export type PollFunctionInput = {
	secret: SecretValue;
	input: PollerInput;
	logger: Logger;
};

export type LongPollFunction = ({
	input,
}: PollFunctionInput) => Promise<LongPollOutput>;

export type FixedFrequencyPollFunction = ({
	input,
}: PollFunctionInput) => Promise<FixedFrequencyPollOutput>;

export type PollFunction = LongPollFunction | FixedFrequencyPollFunction;

export type IngestorPayload = {
	externalId: string;
	body?: IngestorInputBody;
};

export type HandlerInputSqsPayload = {
	Records: Array<{ body: string; messageId: string }>;
};
