module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: [
		'@guardian/eslint-config-typescript',
		'prettier',
		'plugin:react/recommended',
		'plugin:react/jsx-runtime',
		'plugin:react-hooks/recommended',
	],
	plugins: ['@typescript-eslint', 'prettier'],
	env: {
		browser: true,
		es6: true,
		node: true,
	},
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
	},
	parserOptions: {
		project: ['./tsconfig.json', './tsconfig.*.json'],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
};
