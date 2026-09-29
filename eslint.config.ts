import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig({
	html: {
		overrides: {
			'@html-eslint/no-inline-styles': 'off',
		},
	},
	rules: {
		'require-unicode-regexp': ['error', { requireFlag: 'u' }],
	},
	svelte: {
		overrides: {
			'unicorn/no-array-reduce': 'off',
			'unicorn/prefer-global-this': 'off',
		},
	},
	type: 'lib',
})
