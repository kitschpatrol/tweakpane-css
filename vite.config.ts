/* eslint-disable perfectionist/sort-objects */
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

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
					assetFileNames: `[name].[ext]`,
					chunkFileNames: `[name].js`,
					dir: 'dist',
					entryFileNames: `[name].js`,
					format: 'iife',
				},
			},
		},
	}
})
