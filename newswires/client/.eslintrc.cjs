module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	overrides: [
		{
			parserOptions: {
				project: ['./tsconfig.json', './tsconfig.*.json'],
			},
			files: ['*.ts', '*.tsx'],
		},
	],
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
		'react/no-unknown-property': ['error', { ignore: ['css'] }],
		'no-restricted-syntax': [
			'error',
			{
				message:
					"Don't use `fetch` directly, please use the `pandaFetch` abstraction, to get automatic session refreshes",
				selector: "CallExpression[callee.name='fetch']",
			},
		],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
};
