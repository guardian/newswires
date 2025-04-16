import guardian from '@guardian/eslint-config';
import storybook from 'eslint-plugin-storybook';

export default [
	...guardian.configs.recommended,
	...guardian.configs.jest,
	...guardian.configs.react,
	...storybook.configs['flat/recommended'],
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'no-restricted-syntax': [
				'error',
				{
					message:
						"Don't use `fetch` directly, please use the `pandaFetch` abstraction, to get automatic session refreshes",
					selector: "CallExpression[callee.name='fetch']",
				},
			],
		},
	},
];
