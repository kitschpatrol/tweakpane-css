/* eslint-disable perfectionist/sort-objects */
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { liveReload } from 'vite-plugin-live-reload'

export default defineConfig(({ mode }) => {
	const production = mode === 'production'

	return {
		plugins: [
			svelte({
				configFile: false,
				compilerOptions: { dev: !production },
				emitCss: false,
				preprocess: vitePreprocess(),
			}),
			liveReload('dist/main.js'),
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
		optimizeDeps: {
			exclude: ['svelte-tweakpane-ui'],
		},
		server: {
			open: true,
			watch: {
				awaitWriteFinish: true,
			},
		},
	}
})
