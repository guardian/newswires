export type SecretValue = string; //TODO refine type

export type PollerInput = string;

export interface CorePollerOutput {
	payloadForIngestionLambda: unknown; //TODO change to be the shared/agreed type the ingestion lambda expects
}
export type LongPollOutput = CorePollerOutput & { valueForNextPoll: string };

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
