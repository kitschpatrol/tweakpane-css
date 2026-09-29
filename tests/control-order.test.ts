import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

// Serve the fixture and the built bundle from disk under a fake origin, so no
// dev server is needed. Run `pnpm build` first; `pnpm test` does this for you.
const ORIGIN = 'https://fixture.test'

const DECLARED_ORDER = [
	'--zeta-width',
	'Size',
	'--size-small',
	'--size-calculated',
	'--size-tint',
	'--size-large',
	'--accent',
	'--alpha-opacity',
]

/**
 * Read the pane's folder titles and control labels in rendered order, stopping
 * at the Copy / Reset button grid that follows the CSS variable controls.
 */
async function getControlLabels(page: Page): Promise<string[]> {
	return page.evaluate(() => {
		const labels = Array.from(document.querySelectorAll('.tp-fldv_t, .tp-lblv_l'), (element) =>
			element.textContent.trim(),
		)
		return labels.slice(0, labels.indexOf(''))
	})
}

async function toggleOption(page: Page, label: string): Promise<void> {
	await page.locator('.tp-lblv', { hasText: label }).locator('.tp-ckbv_l').click()
}

test.beforeEach(async ({ page }) => {
	await page.route(`${ORIGIN}/**`, async (route) => {
		const { pathname } = new URL(route.request().url())
		const isBundle = pathname === '/dist/main.js'
		await route.fulfill({
			body: await readFile(isBundle ? 'dist/main.js' : 'tests/fixture.html'),
			contentType: isBundle ? 'text/javascript' : 'text/html',
		})
	})

	await page.goto(`${ORIGIN}/`)
	await expect.poll(async () => getControlLabels(page)).toEqual(DECLARED_ORDER)
	await page.locator('.tp-fldv_t', { hasText: 'Options' }).click()
})

test('keeps folder order when a control is removed from it', async ({ page }) => {
	await toggleOption(page, 'Include Calculated')
	await expect
		.poll(async () => getControlLabels(page))
		.toEqual([
			'--zeta-width',
			'Size',
			'--size-small',
			'--size-tint',
			'--size-large',
			'--accent',
			'--alpha-opacity',
		])

	await toggleOption(page, 'Include Calculated')
	await expect.poll(async () => getControlLabels(page)).toEqual(DECLARED_ORDER)
})

test('reorders controls when sorting is toggled', async ({ page }) => {
	await toggleOption(page, 'Sort Names')
	await expect
		.poll(async () => getControlLabels(page))
		.toEqual([
			'--accent',
			'--alpha-opacity',
			'Size',
			'--size-calculated',
			'--size-large',
			'--size-small',
			'--size-tint',
			'--zeta-width',
		])

	await toggleOption(page, 'Sort Names')
	await expect.poll(async () => getControlLabels(page)).toEqual(DECLARED_ORDER)
})

test('flattens and restores folders when auto folders is toggled', async ({ page }) => {
	await toggleOption(page, 'Auto Folders')
	await expect
		.poll(async () => getControlLabels(page))
		.toEqual(DECLARED_ORDER.filter((label) => label !== 'Size'))

	await toggleOption(page, 'Auto Folders')
	await expect.poll(async () => getControlLabels(page)).toEqual(DECLARED_ORDER)
})
