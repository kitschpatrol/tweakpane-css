/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable no-new */

// IIFE wrapper for Tweakpane CSS

import TweakpaneCss, { preload } from './components/TweakpaneCss.svelte'
import elementReady from 'element-ready'

// Reduces FOUC
void elementReady(':root').then(() => {
	preload()
})

// Add the svelte component to the DOM
void elementReady('body').then((element) => {
	new TweakpaneCss({
		target: element as HTMLElement,
	})
})
