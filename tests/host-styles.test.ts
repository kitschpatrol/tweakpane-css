import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const ORIGIN = 'https://fixture.test'

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
})

test('number knobs can be dragged when the host page disables pointer events', async ({ page }) => {
	// Pages with a background that tracks the pointer do this, re-enabling
	// pointer events only for their own interactive elements
	await page.addStyleTag({ content: 'body { pointer-events: none; }' })

	const knob = page.locator('.tp-lblv', { hasText: '--zeta-width' }).locator('.tp-txtv_k')
	await expect(knob).toBeVisible()
	const box = await knob.boundingBox()
	if (box === null) {
		throw new Error('The --zeta-width number knob is not rendered')
	}

	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
	await page.mouse.down()
	await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2, { steps: 5 })
	await page.mouse.up()

	await expect
		.poll(async () =>
			page.evaluate(() =>
				getComputedStyle(document.documentElement).getPropertyValue('--zeta-width'),
			),
		)
		.not.toBe('5px')
})
