import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig({
	html: {
		overrides: {
			'@html-eslint/no-inline-styles': 'off',
		},
	},
	svelte: {
		overrides: {
			// TODO Revisit this
			'svelte/require-each-key': 'off',
			'svelte/require-store-reactive-access': 'off',
			'ts/no-unnecessary-condition': 'off',
			'ts/no-unsafe-type-assertion': 'off',
			'unicorn/no-array-reduce': 'off',
			'unicorn/prefer-global-this': 'off',
		},
	},
	type: 'lib',
})
