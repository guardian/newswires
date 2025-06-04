import { useSearch } from './context/SearchContext';
import { getTelemetryUrl } from './telemetry';

export const TelemetryPixel = ({ stage }: { stage: string }) => {
	const telemetryUrl = getTelemetryUrl(stage);
	const { config } = useSearch();

	const path = config.view === 'home' ? '/' : config.view;

	return (
		<img
			height="0"
			width="0"
			src={`${telemetryUrl}/guardian-tool-accessed?app=newswires&stage=${stage}&path=${path}`}
		></img>
	);
};
