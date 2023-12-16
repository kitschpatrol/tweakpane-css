<script context="module" lang="ts">
	function getUnits(value: string): string {
		// Don't get confused by hex colors or complex expressions
		if (Number.isNaN(Number.parseFloat(value))) return ''
		const match = /^(-?[\d.]+)\s?([%a-z]*)$/i.exec(value)
		return match?.[2] ?? ''
	}

	export function preload(): void {
		if (typeof localStorage !== 'undefined') {
			const cssVariables = localStorage.getItem('css')
			if (cssVariables) {
				for (const [variableName, value] of Object.entries(
					JSON.parse(cssVariables) as Record<string, number | string>,
				)) {
					const units = getUnits(
						window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
					)
					document.documentElement.style.setProperty(
						variableName,
						`${value}${units ? `${units}` : ''}`,
					)
				}
			}
		}
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte'
	import { persisted } from 'svelte-local-storage-store'
	import AutoValue from 'svelte-tweakpane-ui/AutoValue.svelte'
	import ButtonGrid from 'svelte-tweakpane-ui/ButtonGrid.svelte'
	import type { ButtonGridClickEvent } from 'svelte-tweakpane-ui/ButtonGrid.svelte'
	import Pane from 'svelte-tweakpane-ui/Pane.svelte'
	import Separator from 'svelte-tweakpane-ui/Separator.svelte'
	import type { Writable } from 'svelte/store'

	const logPrefix = '[tweakpane-css]'

	// Helper functions
	function parseNumberOrReturnOriginal(text: string): number | string {
		// Also strips suffixed units
		const parsed = Number.parseFloat(text)
		return Number.isNaN(parsed) ? text : parsed
	}

	async function copyToClipboard(text: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(text)
			console.log(`${logPrefix} Copied to clipboard:\n${text}`)
		} catch (error) {
			console.error(`${logPrefix} Failed to copy text: ${String(error)}`)
		}
	}

	function cleanName(name: string): string {
		return name
			.replace('--', '')
			.replaceAll('-', ' ')
			.replaceAll(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase())
	}

	// Set up stores for local persistence
	let cssVariableStore: Writable<Record<string, number | string>>

	onMount(() => {
		// Get all the root css variables
		const rootCssVariables: string[] = [...document.styleSheets]
			.flatMap((styleSheet: CSSStyleSheet) => [...styleSheet.cssRules])
			.filter(
				(cssRule: CSSRule): cssRule is CSSStyleRule =>
					cssRule instanceof CSSStyleRule && cssRule.selectorText === ':root',
			)
			.flatMap((cssRule: CSSStyleRule) => [...cssRule.style])
			.filter((style: string) => style.startsWith('--'))

		// Set up the persistent local store
		cssVariableStore = persisted(
			'css',
			rootCssVariables.reduce<Record<string, number | string>>((acc, variableName) => {
				acc[variableName] = parseNumberOrReturnOriginal(
					window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
				)
				return acc
			}, {}),
		)

		// Clean up stale keys in the store
		for (const key of Object.keys(cssVariableStore)) {
			if (!rootCssVariables.includes(key)) {
				// TODO revisit $?
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete $cssVariableStore[key]
			}
		}
	})

	// Buttons
	function handleClick(event: ButtonGridClickEvent) {
		switch (event.detail.label) {
			case 'Copy': {
				copyCss()
				break
			}

			case 'Reset': {
				reset()
				break
			}

			default: {
				break
			}
		}
	}

	function copyCss() {
		const directives = Object.entries($cssVariableStore).map(([variableName, value]) => {
			const units = getUnits(
				window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
			)
			return `\t${variableName}: ${value}${units ? `${units}` : ''};\n`
		})

		void copyToClipboard(`:root {\n${directives.join('')}}`)
	}

	function reset() {
		console.log(`${logPrefix} Clearing changes to CSS Variables`)
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('css')
			location.reload()
		}
	}

	// Reactive
	$: if (cssVariableStore) {
		// Set the css variables on the document, appending the original unit if needed
		for (const variableName of Object.keys($cssVariableStore)) {
			const units = getUnits(
				window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
			)

			document.documentElement.style.setProperty(
				variableName,
				`${$cssVariableStore[variableName]}${units ? `${units}` : ''}`,
			)
		}
	}
</script>

<Pane localStoreId="tweakpane-css" title="Tweakpane CSS">
	{#if cssVariableStore}
		{#each Object.keys($cssVariableStore) as variableName}
			{@const originalValue = window
				.getComputedStyle(document.documentElement)
				.getPropertyValue(variableName)}
			{@const units = getUnits(originalValue)}
			<AutoValue
				bind:value={$cssVariableStore[variableName]}
				label={`${cleanName(variableName)}${units ? ` (${units})` : ''}`}
			/>
		{/each}
	{/if}
	<Separator />
	<ButtonGrid buttons={['Copy', 'Reset']} on:click={handleClick} />
</Pane>
