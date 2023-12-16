/* @type {import('eslint').Linter.Config} */
module.exports = {
	extends: ['@kitschpatrol/eslint-config'],
	parserOptions: {
		project: 'tsconfig.eslint.json',
	},
	root: true,
}
