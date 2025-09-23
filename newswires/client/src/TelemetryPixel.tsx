import { getTelemetryUrl } from './telemetry';

export const TelemetryPixel = ({ stage }: { stage: string }) => {
	const telemetryUrl = getTelemetryUrl(stage);

	const path = window.location.pathname;

	return (
		<img
			height="0"
			width="0"
			src={`${telemetryUrl}/guardian-tool-accessed?app=newswires&stage=${stage}&path=${path}`}
		></img>
	);
};
