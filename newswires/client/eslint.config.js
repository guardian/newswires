import guardian from '@guardian/eslint-config';
import prettier from 'eslint-plugin-prettier';

export default [
	{
		ignores: ['dist'],
	},
	...guardian.configs.recommended,
	...guardian.configs.jest,
	...guardian.configs.react,
	{
		plugins: { prettier },
	},
	{
		rules: {
			'no-unused-vars': 'off',

			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],

			'prettier/prettier': 'warn',

			'react/no-unknown-property': [
				'error',
				{
					ignore: ['css'],
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
