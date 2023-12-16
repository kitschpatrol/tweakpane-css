import sharedConfig from '@kitschpatrol/prettier-config'

/** @type {import("prettier").Config} */
const localConfig = {
	// Overrides (in 3.0.5)
	semi: false,
	overrides: [
		...sharedConfig.overrides,
		{
			files: ['*.md', '*.mdx', '*.yml'],
			options: {
				useTabs: false,
			},
		},
	],
}

export default {
	...sharedConfig,
	...localConfig,
}
