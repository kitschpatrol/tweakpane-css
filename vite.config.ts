/* eslint-disable perfectionist/sort-objects */
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

process.env.BROWSER = 'chromium'

export default defineConfig(({ mode }) => {
	const production = mode === 'production'

	return {
		plugins: [
			svelte({
				compilerOptions: { dev: !production },
				emitCss: false,
			}),
		],
		build: {
			minify: true,
			rollupOptions: {
				input: `src/main.ts`,
				output: {
					chunkFileNames: `[name].js`,
					assetFileNames: `[name].[ext]`,
					dir: 'dist',
					entryFileNames: `[name].js`,
					format: 'iife',
				},
			},
		},
		server: {
			open: true,
		},
	}
})
