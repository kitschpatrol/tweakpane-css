/* eslint-disable ts/no-unsafe-call */

// IIFE wrapper for Tweakpane CSS

import elementReady from 'element-ready'
// TODO Revisit this
// eslint-disable-next-line depend/ban-dependencies
import qs from 'qs'
import { mount } from 'svelte'
import TweakpaneCss, { preload } from './components/TweakpaneCss.svelte'

// Revisit these warnings once we have tests
const NUMERIC_STRING_REGEX =
	// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/prefer-question-quantifier, regexp/no-useless-non-capturing-group, regexp/no-empty-alternative
	/^(?:-[1-9](?:\d{0,2}(?:,\d{3})+|\d*)|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|)$/u
// Qs vs query-string is tricky, but going with qs for now so we don't have to
// flatten the options object
// Full query string of TweakpaneCSS Svelte component props:
// ?exclude=transform,transition,animation&options.autoFolders=true&options.includeCalculated=true&options.prettyNames=true&options.showUnits=true&options.sortNames=true
// qs stringify options: { allowDots: true, arrayFormat: 'comma', encode: false }

const queryString = new URL((document.currentScript as HTMLScriptElement).src).search

// Restore persisted values while this classic script is still blocking the parser,
// so the browser cannot paint the original values first.
preload()

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
			if (type === 'value' && NUMERIC_STRING_REGEX.test(string_)) {
				// Number.parseFloat preserves the existing handling of comma-formatted values.
				// eslint-disable-next-line unicorn/prefer-number-coercion
				return Number.parseFloat(string_)
			}

			const keywords = {
				false: false,
				// eslint-disable-next-line unicorn/no-null
				null: null,
				true: true,
				undefined,
			}
			return type === 'value' && Object.hasOwn(keywords, string_)
				? keywords[string_ as keyof typeof keywords]
				: defaultDecoder(string_, defaultDecoder, charset)
		},
		ignoreQueryPrefix: true,
	})
	if (element === undefined) {
		return
	}

	mount(TweakpaneCss, {
		props,
		target: element,
	})
})
