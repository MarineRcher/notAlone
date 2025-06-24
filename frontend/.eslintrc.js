module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		project: './tsconfig.json',
		ecmaFeatures: {
			jsx: true,
		},
	},
	plugins: [
		'@typescript-eslint',
		'prettier',
		'react',
		'react-native',
	],
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'@react-native-community',
		'prettier',
	],
	rules: {
		// Prettier integration
		'prettier/prettier': 'error',
		
		// Function maximum 25 lines (excluding braces)
		'max-lines-per-function': [
			'error',
			{
				max: 25,
				skipBlankLines: true,
				skipComments: true,
				IIFEs: true
			}
		],
		
		// Maximum line length 80 characters
		'max-len': [
			'error',
			{
				code: 80,
				comments: 80,
				ignoreUrls: true,
				ignoreStrings: true,
				ignoreTemplateLiterals: true
			}
		],
		
		// One statement per line
		'max-statements-per-line': [
			'error',
			{
				max: 1
			}
		],
		
		// No trailing spaces
		'no-trailing-spaces': 'error',
		
		// Require newlines around control statements
		'curly': [
			'error',
			'all'
		],
		'brace-style': [
			'error',
			'allman',
			{
				allowSingleLine: false
			}
		],
		
		// Spaces after commas and semicolons
		'comma-spacing': [
			'error',
			{
				before: false,
				after: true
			}
		],
		'semi-spacing': [
			'error',
			{
				before: false,
				after: true
			}
		],
		
		// Space around operators
		'space-infix-ops': 'error',
		'space-unary-ops': [
			'error',
			{
				words: true,
				nonwords: false
			}
		],
		
		// Space after keywords
		'keyword-spacing': [
			'error',
			{
				before: true,
				after: true
			}
		],
		
		// One variable declaration per line
		'one-var': [
			'error',
			'never'
		],
		
		// Variables at top of function
		'vars-on-top': 'error',
		
		// No empty lines with spaces/tabs
		'no-mixed-spaces-and-tabs': 'error',
		
		// Operator placement at beginning of line when breaking
		'operator-linebreak': [
			'error',
			'before'
		],
		
		// Consistent indentation (handled by Prettier)
		'indent': 'off',
		
		// TypeScript specific rules
		'@typescript-eslint/explicit-function-return-type': 'error',
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/prefer-const': 'error',
		
		// Function declarations style
		'func-style': [
			'error',
			'declaration'
		],
		
		// Require blank line after variable declarations
		'newline-after-var': [
			'error',
			'always'
		],
		
		// Padded blocks (declarations separated from implementation)
		'padded-blocks': [
			'error',
			{
				blocks: 'never',
				classes: 'never',
				switches: 'never'
			}
		],
		
		// React Native specific adjustments
		'react-native/no-unused-styles': 'error',
		'react-native/split-platform-components': 'error',
		'react-native/no-inline-styles': 'warn',
		'react-native/no-color-literals': 'warn',
		
		// React specific rules
		'react/jsx-uses-react': 'error',
		'react/jsx-uses-vars': 'error',
	},
	env: {
		'react-native/react-native': true,
		es6: true,
		jest: true
	}
}; 