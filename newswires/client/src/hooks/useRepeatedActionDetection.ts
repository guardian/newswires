import { useCallback, useEffect, useRef, useState } from 'react';

export function useRepeatedActionDetection({
	repetitionThreshold,
	delay,
}: {
	repetitionThreshold: number;
	delay: number;
}) {
	const [actionCount, setActionCount] = useState(0);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const registerAction = useCallback(() => {
		setActionCount((count) => count + 1);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			setActionCount(0);
		}, delay);
	}, [delay]);

	const isRepeatedAction = actionCount >= repetitionThreshold;

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return { registerAction, isRepeatedAction };
}
