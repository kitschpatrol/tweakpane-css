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
		},
	},
	type: 'lib',
})
