import { remarkConfig } from '@kitschpatrol/remark-config'

export default remarkConfig({
	rules: [
		['remark-lint-no-html', false],
		['remark-lint-fenced-code-flag', false],
	],
})
