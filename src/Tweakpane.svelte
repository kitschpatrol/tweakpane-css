<script lang="ts">
	import { persisted } from 'svelte-local-storage-store'
	import { onMount } from 'svelte'
	import { Pane } from 'tweakpane'
	import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
	import type { ButtonGridApi } from '@tweakpane/plugin-essentials'
	import type { Writable } from 'svelte/store'

	// useful for the astro wrapper, since <svelte:head> doesn't render at build time
	// false skips the <svelte:head> section and assumes the head script will be added in a different way
	export let setCssVarsBeforePageRender = true

	const minPanelWidth = 200

	let containerElement: HTMLElement // takes over existing tweakpane dom
	let dragBarElement: HTMLElement // added dynamically to tweakpane DOM
	let containerHeight: number // driven by tweakpane's internal layout
	let documentWidth: number
	let documentHeight: number

	// Helper functions
	function parseNumberOrReturnOriginal(str: string): number | string {
		// also strips suffixed units
		const parsed = parseFloat(str)
		return isNaN(parsed) ? str : parsed
	}

	function clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), max)
	}

	async function copyToClipboard(text: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(text)
			console.log(`[tweakpane-css] Copied to clipboard:\n${text}`)
		} catch (err) {
			console.error(`[tweakpane-css] Failed to copy text: ${err}`)
		}
	}

	function cleanName(name: string): string {
		return name
			.replace('--', '')
			.replaceAll('-', ' ')
			.replace(/\w\S*/g, function (txt) {
				return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
			})
	}

	function getUnits(value: string): string {
		// don't get confused by hex colors or complex expressions
		if (isNaN(parseFloat(value))) return ''
		const match = value.match(/^(-?[\d.]+)\s?([a-z%]*)$/i)
		return match && match[2] ? match[2] : ''
	}

	function setDocumentSize() {
		const documentWidthPrevious = documentWidth
		const documentHeightPrevious = documentHeight
		documentWidth = document.documentElement.clientWidth
		documentHeight = document.documentElement.clientHeight
		const dx = documentWidth - documentWidthPrevious
		const dy = documentHeight - documentHeightPrevious

		// ensure we "stick" to the correct quadrant
		const centerPercentX = ($panelConfigStore.x + $panelConfigStore.width / 2) / documentWidth
		const centerPercentY = ($panelConfigStore.y + containerHeight / 2) / documentHeight

		if (!isNaN(dx) && centerPercentX >= 0.5) {
			$panelConfigStore.x += dx
		}

		if (!isNaN(dy) && centerPercentY >= 0.5) {
			$panelConfigStore.y += dy
		}
	}

	// set up stores for local persistence
	let cssVarStore: Writable<Record<string, string | number>>

	let panelConfigStore: Writable<{
		expanded: boolean
		width: number
		x: number
		y: number
	}> = persisted('tweakpane', {
		expanded: true,
		width: 350,
		x: 0,
		y: 0,
	})

	onMount(() => {
		setDocumentSize()

		// get all the root css variables
		const rootCssVariables: string[] = Array.from(document.styleSheets)
			.flatMap((styleSheet: CSSStyleSheet) => Array.from(styleSheet.cssRules))
			.filter(
				(cssRule: CSSRule): cssRule is CSSStyleRule =>
					cssRule instanceof CSSStyleRule && cssRule.selectorText === ':root',
			)
			.flatMap((cssRule: CSSStyleRule) => Array.from(cssRule.style))
			.filter((style: string) => style.startsWith('--'))

		// set up the persistent local store
		cssVarStore = persisted(
			'css',
			rootCssVariables.reduce((acc, variableName) => {
				acc[variableName] = parseNumberOrReturnOriginal(
					window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
				)
				return acc
			}, {} as Record<string, number | string>),
		)

		// clean up stale keys in the store
		Object.keys($cssVarStore).forEach((key) => {
			if (!rootCssVariables.includes(key)) {
				delete $cssVarStore[key]
			}
		})

		// console.log(`[tweakpane-css] Initial $cssVarStore: ${JSON.stringify($cssVarStore, null, 2)}`)

		// set up the tweakpane
		const pane = new Pane({
			title: 'Tweakpane CSS',
			expanded: $panelConfigStore.expanded,
			container: containerElement,
		})
		pane.registerPlugin(EssentialsPlugin)

		pane.on('change', () => {
			cssVarStore.set($cssVarStore) // force an update
		})

		pane.on('fold', (e) => {
			$panelConfigStore.expanded = e.expanded
		})

		// create an input for each css variables
		Object.keys($cssVarStore).forEach((variableName) => {
			const originalValue = window
				.getComputedStyle(document.documentElement)
				.getPropertyValue(variableName)
			const units = getUnits(originalValue)
			pane.addBinding($cssVarStore, variableName, {
				label: `${cleanName(variableName)}${units ? ` (${units})` : ''}`,
			})
		})

		pane.addBlade({ view: 'separator' })

		// buttons to clear and copy
		;(
			pane.addBlade({
				view: 'buttongrid',
				size: [2, 1],
				cells: (x: number, y: number) => ({
					title: [['Copy CSS', 'Reset']].at(y)?.at(x),
				}),
			}) as ButtonGridApi
		).on('click', (ev) => {
			switch (ev.index[0]) {
				case 0:
					{
						const directives = Object.entries($cssVarStore).map(([variableName, value]) => {
							const units = getUnits(
								window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
							)
							return `\t${variableName}: ${value}${units ? `${units}` : ''};\n`
						})

						copyToClipboard(`:root {\n${directives.join('')}}`)
					}
					break
				case 1:
					{
						console.log(`[tweakpane-css] Clearing changes to CSS Variables`)
						if (typeof localStorage !== 'undefined') {
							localStorage.removeItem('css')
							location.reload()
						}
					}
					break
			}
		})

		// make the pane draggable
		dragBarElement = containerElement.getElementsByClassName('tp-rotv_t')[0] as HTMLElement

		const clickBlocker = (e: MouseEvent) => {
			e.stopPropagation()
		}

		const doubleClickListener = (e: MouseEvent) => {
			e.stopPropagation()
			pane.expanded = !pane.expanded
		}
		dragBarElement.addEventListener('click', clickBlocker)
		dragBarElement.addEventListener('dblclick', doubleClickListener)

		const downListener = (e: PointerEvent) => {
			if (e.target instanceof HTMLElement) {
				e.target.setPointerCapture(e.pointerId)
				e.target.addEventListener('pointermove', moveListener)
				e.target.addEventListener('pointerup', upListener)
			}
		}

		const moveListener = (e: PointerEvent) => {
			if (e.target instanceof HTMLElement) {
				if (e.target === dragBarElement) {
					$panelConfigStore.x += e.movementX
					$panelConfigStore.y += e.movementY
				} else if (e.target === widthHandleElement) {
					$panelConfigStore.width = clamp(
						$panelConfigStore.width + e.movementX,
						minPanelWidth,
						documentWidth - $panelConfigStore.x,
					)
				}
			}
		}

		const upListener = (e: PointerEvent) => {
			e.stopImmediatePropagation()
			if (e.target instanceof HTMLElement) {
				e.target.releasePointerCapture(e.pointerId)
				e.target.removeEventListener('pointermove', moveListener)
				e.target.removeEventListener('pointerup', upListener)
			}
		}

		dragBarElement.addEventListener('pointerdown', downListener)

		// add width adjuster
		const widthHandleElement = dragBarElement.parentElement?.appendChild(
			document.createElement('div'),
		)
		if (widthHandleElement) {
			widthHandleElement.className = 'tp-custom-width-handle'
			widthHandleElement.innerText = '↔'
			widthHandleElement.addEventListener('click', clickBlocker)
			widthHandleElement.addEventListener('pointerdown', downListener)
		}

		// clean up
		return () => {
			dragBarElement.removeEventListener('click', clickBlocker)
			dragBarElement.removeEventListener('dblclick', doubleClickListener)
			dragBarElement.removeEventListener('pointermove', moveListener)
			dragBarElement.removeEventListener('pointerup', upListener)
			dragBarElement.removeEventListener('pointerdown', downListener)

			if (widthHandleElement) {
				widthHandleElement.removeEventListener('click', clickBlocker)
				widthHandleElement.removeEventListener('pointermove', moveListener)
				widthHandleElement.removeEventListener('pointerup', upListener)
				widthHandleElement.removeEventListener('pointerdown', downListener)
			}
			pane.dispose()
		}
	})

	// Reactive
	$: if ($cssVarStore) {
		// set the css variables on the document, appending the original unit if needed
		Object.keys($cssVarStore).forEach((variableName) => {
			const units = getUnits(
				window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
			)

			document.documentElement.style.setProperty(
				variableName,
				`${$cssVarStore[variableName]}${units ? `${units}` : ''}`,
			)
		})
	}

	// ensure the tweakpane panel is within the viewport
	// additional checks in width drag handler
	$: if ($panelConfigStore && containerHeight && documentWidth && documentHeight) {
		$panelConfigStore.x = clamp($panelConfigStore.x, 0, documentWidth - $panelConfigStore.width)
		$panelConfigStore.y = clamp($panelConfigStore.y, 0, documentHeight - containerHeight)
		if (documentWidth < $panelConfigStore.width) {
			$panelConfigStore.width = Math.max(minPanelWidth, documentWidth)
		}
	}
</script>

<div
	class="tweakpane-container"
	style={`width: ${$panelConfigStore.width}px; left: ${$panelConfigStore.x}px; top: ${$panelConfigStore.y}px`}
	bind:this={containerElement}
	bind:clientHeight={containerHeight}
/>

<svelte:window on:resize={setDocumentSize} />

<svelte:head>
	{#if setCssVarsBeforePageRender}
		<script>
			if (typeof localStorage !== 'undefined') {
				const cssVars = localStorage.getItem('css')
				cssVars &&
					Object.entries(JSON.parse(cssVars)).forEach(([variableName, value]) => {
						const units = ((val) =>
							isNaN(parseFloat(val)) ? '' : val.match(/^-?[\d.]+\s?([a-z%]*)$/i)?.[1] || '')(
							window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
						)
						document.documentElement.style.setProperty(
							variableName,
							`${value}${units ? `${units}` : ''}`,
						)
					})
			}
		</script>
	{/if}
</svelte:head>

<style>
	div.tweakpane-container {
		position: fixed;
	}

	/* stylelint-disable-next-line selector-class-pattern */
	:global(div.tp-rotv_t) {
		cursor: grab;
	}

	/* stylelint-disable-next-line selector-class-pattern */
	:global(div.tp-rotv_m) {
		right: unset;
		left: calc(var(--cnt-h-p) + (var(--bld-us) + 4px - 6px) / 2 - 2px);
	}

	/* stylelint-disable-next-line selector-class-pattern */
	:global(div.tp-rotv_t:active) {
		background: var(--tp-input-background-color-active);
		cursor: grabbing;
	}

	:global(div.tp-custom-width-handle) {
		position: absolute;
		height: 100%;
		aspect-ratio: 1;
		top: 0;
		right: 0;
		cursor: col-resize;
		font-size: 1.5em;
		color: var(--cnt-fg);
		opacity: 0.5;
	}
</style>
