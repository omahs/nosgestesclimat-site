module.exports = {
	root: true,
	parser: '@babel/eslint-parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
	},
	env: {
		browser: true,
		commonjs: true,
		es6: true,
	},
	globals: {
		process: false,
	},
	plugins: ['react', 'react-hooks', 'jsx-a11y'],
	rules: {
		quotes: [
			1,
			'single',
			{
				avoidEscape: true,
			},
		],
		'no-console': 1,
		'no-restricted-globals': [2, 'length'],
		'no-global-assign': 0,
		'no-unsafe-negation': 0,
		'react/prop-types': 0,
		'react/jsx-no-target-blank': 0,
		'react/no-unescaped-entities': 0,
		'react/display-name': 0,
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'warn',
		'react/jsx-uses-react': 'off',
		'react/react-in-jsx-scope': 'off',
		'react/no-unknown-property': ['error', { ignore: ['css'] }],
	},
	settings: {
		'import/resolver': {
			alias: {
				map: [['@', './source']],
				extensions: ['.tsx', '.ts', '.js', '.jsx', '.svg'],
			},
		},
	},
	overrides: [
		{
			files: ['**/*.js?(x)'],
			parser: '@typescript-eslint/parser',
			rules: {
				'no-undef': 'error',
			},
			excludedFiles: [
				'./.eslintrc.js',
				'./babel.config.js',
				'webpack.dev.js',
				'webpack.prod.js',
				'webpack.common.js',
				'cypress.config.js',
			],
		},
		{
			files: ['**/*.{ts,tsx}'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				tsconfigRootDir: __dirname,
				project: ['./tsconfig.json'],
			},
			plugins: ['@typescript-eslint'],
			rules: {
				'@typescript-eslint/no-empty-function': 0,
				'@typescript-eslint/no-use-before-define': 0,
				'@typescript-eslint/member-delimiter-style': [
					2,
					{
						multiline: {
							delimiter: 'none',
						},
					},
				],
				'@typescript-eslint/explicit-function-return-type': 0,
				'@typescript-eslint/prefer-string-starts-ends-with': 1,
				'@typescript-eslint/no-unnecessary-type-assertion': 1, // has false positives (Object.values result) v 2.29.0
				'@typescript-eslint/no-inferrable-types': 1, // causes problems with unknown values v 2.29.0 typescript v 3.8.3
				'@typescript-eslint/no-var-requires': 'off',
				// TODO - enable these new recommended rules, a first step would be to switch from "off" to "warn"
				'@typescript-eslint/explicit-module-boundary-types': 'off',
				'@typescript-eslint/no-floating-promises': 'off',
				'@typescript-eslint/no-extra-semi': 'off',
				'@typescript-eslint/no-unsafe-assignment': 'off',
				'@typescript-eslint/no-unsafe-call': 'off',
				'@typescript-eslint/no-unsafe-member-access': 'off',
				'@typescript-eslint/no-unsafe-return': 'off',
				'@typescript-eslint/restrict-plus-operands': 'off',
				'@typescript-eslint/restrict-template-expressions': 'off',
				'@typescript-eslint/naming-convention': 'off',
				'@typescript-eslint/prefer-regexp-exec': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-misused-promises': 'off',
			},
			extends: [
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/recommended-requiring-type-checking',
			],
		},
	],
	extends: [
		'eslint:recommended',
		'plugin:react/recommended',
		'prettier',
		'plugin:jsx-a11y/strict',
		'plugin:react-hooks/recommended',
		'plugin:import/errors',
		'plugin:import/typescript',
		'plugin:cypress/recommended',
	],
}
