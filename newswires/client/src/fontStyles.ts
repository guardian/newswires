import { css } from '@emotion/react';

export const fontStyles = css`
	@font-face {
		font-family: 'GuardianTextSans';
		src:
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-Regular.woff2')
				format('woff2'),
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-Regular.woff')
				format('woff');
		font-weight: 400;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'GuardianTextSans';
		src:
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-RegularItalic.woff2')
				format('woff2'),
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-RegularItalic.woff')
				format('woff');
		font-weight: 400;
		font-style: italic;
		font-display: swap;
	}
	@font-face {
		font-family: 'GuardianTextSans';
		src:
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-Medium.woff2')
				format('woff2'),
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-Medium.woff')
				format('woff');
		font-weight: 450;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'GuardianTextSans';
		src:
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-MediumItalic.woff2')
				format('woff2'),
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-MediumItalic.woff')
				format('woff');
		font-weight: 450;
		font-style: italic;
		font-display: swap;
	}
	@font-face {
		font-family: 'GuardianTextSans';
		src:
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-Medium.woff2')
				format('woff2'),
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-Medium.woff')
				format('woff');
		font-weight: 500;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'GuardianTextSans';
		src:
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-MediumItalic.woff2')
				format('woff2'),
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-MediumItalic.woff')
				format('woff');
		font-weight: 500;
		font-style: italic;
		font-display: swap;
	}
	@font-face {
		font-family: 'GuardianTextSans';
		src:
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-Bold.woff2')
				format('woff2'),
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-Bold.woff')
				format('woff');
		font-weight: 600;
		font-style: normal;
		font-display: swap;
	}
	@font-face {
		font-family: 'GuardianTextSans';
		src:
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-BoldItalic.woff2')
				format('woff2'),
			url('https://assets.guim.co.uk/static/frontend/fonts/guardian-textsans/full-not-hinted/GuardianTextSans-BoldItalic.woff')
				format('woff');
		font-weight: 600;
		font-style: italic;
		font-display: swap;
	}

	:root {
		--euiFontFamily:
			'GuardianTextSans', 'Inter', 'Helvetica Neue', Helvetica, Arial,
			sans-serif;
	}

	html {
		font-family: var(--euiFontFamily);
	}

	body,
	input.euiFieldSearch {
		margin: 0;
		font-family: var(--euiFontFamily);
		font-size: 1.1rem;
		line-height: 1.5rem;
	}

	button {
		font-family: var(--euiFontFamily);
	}
`;
