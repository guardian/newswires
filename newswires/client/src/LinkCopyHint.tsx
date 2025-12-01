import { EuiToast } from '@elastic/eui';
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useRepeatedActionDetection } from './hooks/useRepeatedActionDetection';

export const LinkCopyHint = () => {
	const [dragHasBeenAbandoned, setDragHasBeenAbandoned] = useState(false);

	const { registerAction, isRepeatedAction } = useRepeatedActionDetection({
		repetitionThreshold: 2,
		delay: 2000,
	});

	useEffect(() => {
		if (isRepeatedAction) {
			setDragHasBeenAbandoned(true);
		}
	}, [isRepeatedAction]);

	useEffect(() => {
		function handleDragEnd(e: DragEvent) {
			if (
				e.target instanceof HTMLAnchorElement &&
				e.dataTransfer?.dropEffect === 'none'
			) {
				console.log('Drag was abandoned - not dropped anywhere useful');
			}
			registerAction();
		}

		window.addEventListener('dragend', handleDragEnd);

		return () => {
			window.removeEventListener('dragend', handleDragEnd);
		};
	}, [registerAction]);

	return (
		<div
			css={css`
				position: fixed;
				bottom: 20px;
				right: 20px;
				z-index: 1000;
			`}
		>
			{dragHasBeenAbandoned && (
				<EuiToast
					color="primary"
					title="Trying to copy text from the main wires list?"
					onClose={() => setDragHasBeenAbandoned(false)}
				>
					{`If you hold down the 'alt' or 'option' keys, it will let you select
					link text more easily.`}
				</EuiToast>
			)}
		</div>
	);
};
