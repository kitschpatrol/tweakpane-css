/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable no-new */

// IIFE wrapper for Tweakpane CSS

import TweakpaneCss, { preload } from './components/TweakpaneCss.svelte'
import elementReady from 'element-ready'
import qs from 'qs'

// Qs vs query-string is tricky, but going with qs for now so we don't have to
// flatten the options object
// Full query string of TweakpaneCSS Svelte component props:
// ?excludeProperties=transform,transition,animation&options.autoFolders=true&options.includeCalculated=true&options.prettyNames=true&options.showUnits=true&options.sortNames=true
// qs stringify options: { allowDots: true, arrayFormat: 'comma', encode: false }
const queryString = new URL((document.currentScript as HTMLScriptElement).src).search

// Reduces FOUC
void elementReady(':root').then(() => {
	preload()
})

// Add the svelte component to the DOM
void elementReady('body').then((element) => {
	const props = qs.parse(queryString, {
		allowDots: true,
		comma: true,
		// Cast strings to numbers or booleans if possible
		// https://github.com/ljharb/qs/issues/91#issuecomment-1833694874
		decoder(
			string_: string,
			defaultDecoder: qs.defaultDecoder,
			charset: string,
			type: 'key' | 'value',
		) {
			if (
				type === 'value' &&
				/^(?:-[1-9](?:\d{0,2}(?:,\d{3})+|\d*)|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|)$/.test(
					string_,
				)
			) {
				return Number.parseFloat(string_)
			}

			const keywords = {
				false: false,
				// eslint-disable-next-line unicorn/no-null
				null: null,
				true: true,
				undefined,
			}
			if (type === 'value' && string_ in keywords) {
				return keywords[string_ as keyof typeof keywords]
			}

			return defaultDecoder(string_, defaultDecoder, charset)
		},
		ignoreQueryPrefix: true,
	})

	new TweakpaneCss({
		props,
		target: element as HTMLElement,
	})
})
