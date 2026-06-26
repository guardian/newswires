import { Global } from '@emotion/react';
import { fontStyles } from './fontStyles';

/** Exporting this so that we have a single source of truth for global styles
 * which can be shared by both the app and storybook. */
export function GlobalStyles() {
	return <Global styles={fontStyles} />;
}
