import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default defineConfig([
	js.configs.recommended,
	{
		files: ['**/*.ts', '**/*.js'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				project: './tsconfig.json',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
			prettier: prettier,
		},
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
			
			// Override conflicting built-in rules for TypeScript
			'no-unused-vars': 'off',
			
			// Core ESLint rules
			'prefer-const': 'error',
			
			// TypeScript specific rules
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': 'error',
			
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
			]
		},
	},
	{
		ignores: [
			'node_modules/',
			'dist/',
			'coverage/',
			'logs/',
			'*.log',
			'.env*',
			'migrations/',
			'seeders/',
			'*.d.ts',
			'jest.config.js'
		],
	},
]); 