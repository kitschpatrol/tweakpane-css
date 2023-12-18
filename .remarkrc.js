import sharedConfig, { overrideRules } from '@kitschpatrol/remark-config'

const localConfig = {
	...sharedConfig,
	plugins: overrideRules(sharedConfig.plugins, [['remark-lint-no-html', false]]),
	plugins: overrideRules(sharedConfig.plugins, [['remark-lint-no-emphasis-as-heading', false]]),
	plugins: overrideRules(sharedConfig.plugins, [['remark-lint-no-emphasis-as-heading', false]]),
	plugins: overrideRules(sharedConfig.plugins, [['remark-lint-fenced-code-flag', false]]),
}

export default localConfig
