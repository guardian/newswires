import guardian from '@guardian/eslint-config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
	...guardian.configs.recommended,
	...guardian.configs.jest,
	eslintPluginPrettierRecommended,
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
	},

	{
		ignores: [
			'**/*.js',
			'node_modules',
			'cdk.out',
			'jest.config.js',
			'**/generated/*',
		],
	},
];
