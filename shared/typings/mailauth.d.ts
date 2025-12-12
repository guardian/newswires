declare module 'mailauth' {
	export type DkimResult = { results: { status: { result: string } } };
	export type SpfResult = { status: { result: string } };
	export type ArcResult = {
		status: { result: string };
		signature: {
			signingDomain: string;
			status: { result: string };
		};
		authenticationResults: {
			mta: string;
			arc: { result: string };
			spf: { result: string };
		};
	};
	export type ReceivedChain = Array<{
		by: { value: string };
		from?: { value: string; comment?: string };
		for?: { value: string };
	}>;

	export type AuthenticateResult = {
		dkim: DkimResult;
		spf: SpfResult;
		arc: ArcResult;
		receivedChain: ReceivedChain;
	};

	export function authenticate(
		body: string,
		options: { trustReceived: boolean },
	): Promise<AuthenticateResult>;
}
