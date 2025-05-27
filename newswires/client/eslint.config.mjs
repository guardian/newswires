import guardian from '@guardian/eslint-config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import storybook from 'eslint-plugin-storybook';
import newswiresConfig from '../../eslint.config.mjs';


export default [
	...newswiresConfig,
	...guardian.configs.react,
	...storybook.configs['flat/recommended'],
	eslintPluginPrettierRecommended,
	{
		rules: {
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {considerDefaultExhaustiveForUnions: true},
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
