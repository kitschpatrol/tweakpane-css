import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	forbidOnly: Boolean(process.env.CI),
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	testDir: 'tests',
})
