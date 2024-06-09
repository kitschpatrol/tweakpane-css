<script context="module" lang="ts">
	function getUnits(value: string): string | undefined {
		// Don't get confused by hex colors or complex expressions
		if (Number.isNaN(Number.parseFloat(value))) return ''
		const match = /^(-?[\d.]+)\s?([%a-z]*)$/i.exec(value)
		return match?.[2]
	}

	export function preload(): void {
		// Apply any modified styles
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
	import {
		arraysEqual,
		cleanName,
		copyToClipboard,
		getHash,
		parseNumberOrReturnOriginal,
		stripPrefix,
	} from '../utilities'
	import { onMount, tick } from 'svelte'
	import { persisted } from 'svelte-local-storage-store'
	import { Button } from 'svelte-tweakpane-ui'
	import AutoObject from 'svelte-tweakpane-ui/AutoObject.svelte'
	import AutoValue from 'svelte-tweakpane-ui/AutoValue.svelte'
	import ButtonGrid from 'svelte-tweakpane-ui/ButtonGrid.svelte'
	import type { ButtonGridClickEvent } from 'svelte-tweakpane-ui/ButtonGrid.svelte'
	import Folder from 'svelte-tweakpane-ui/Folder.svelte'
	import Pane from 'svelte-tweakpane-ui/Pane.svelte'
	import Separator from 'svelte-tweakpane-ui/Separator.svelte'
	import { type Writable } from 'svelte/store'

	// Types
	type Options = {
		autoFolders?: boolean
		includeCalculated?: boolean
		prettyNames?: boolean
		showUnits?: boolean
		sortNames?: boolean
	}

	type FolderPlan = {
		children: ControlPlan[]
		expanded?: boolean
		label: string
		type: 'folder'
	}

	type ControlPlan = {
		key: string
		label: string
		type: 'control'
	}

	type Plan = ControlPlan | FolderPlan

	// Key string is the hash of the keys in the folder
	type ExpandedState = Record<string, boolean>

	// Defaults
	const logPrefix = '[tweakpane-css]'
	const defaultOptions: Options = {
		autoFolders: false,
		includeCalculated: false,
		prettyNames: true,
		showUnits: true,
		sortNames: false,
	}

	// Props
	export let exclude: string[] = []
	export let options: Options = defaultOptions

	// Stores

	// Set up stores for local persistence
	let cssVariableStore: Writable<Record<string, number | string>>
	let optionsStore: Writable<Options>
	let expandedStateStore: Writable<ExpandedState>

	// Set up persistent local options store, with defaults
	optionsStore = persisted('css-options', options)

	// Store folder states
	const optionsExpandedStateKey = 'tweakpane-css-options-05860cf2958c'
	expandedStateStore = persisted('css-expanded-state', {
		optionsExpandedStateKey: false,
	})

	// Helper functions

	function stripLabelPrefix<T extends Plan>(plan: T): T {
		return {
			...plan,
			label: stripPrefix(plan.label),
		}
	}

	function getControlPlanFromStore(
		cssVariableKeys: string[] | undefined,
		options: Options,
	): Plan[] {
		if (cssVariableKeys === undefined) return []
		// Sort if needed
		const keys = options.sortNames ? cssVariableKeys.toSorted() : cssVariableKeys

		// First pass omits the unwanted
		const controls = keys.reduce<ControlPlan[]>((accumulator, key) => {
			const originalValue = window.getComputedStyle(document.documentElement).getPropertyValue(key)

			if (!options.includeCalculated && originalValue.includes('calc(')) {
				return accumulator
			}

			const units = getUnits(originalValue)
			return [
				...accumulator,
				{
					key,
					label: `${options.prettyNames ? cleanName(key) : key}${units && options.showUnits ? ` (${units})` : ''}`,
					type: 'control',
				},
			]
		}, [])

		// Second pass to group into folders, maintaining order
		if (options.autoFolders && controls.length > 1) {
			const autoFolderControls: Plan[] = []

			for (const [index, control] of controls.entries()) {
				const lastPrefix = index > 0 ? cleanName(controls[index - 1].key).split(' ')[0] : undefined
				const thisPrefix = cleanName(control.key).split(' ')[0]
				const nextPrefix =
					index < controls.length - 1 ? cleanName(controls[index + 1].key).split(' ')[0] : undefined

				if ((lastPrefix === undefined || lastPrefix !== thisPrefix) && thisPrefix === nextPrefix) {
					// Start folder
					autoFolderControls.push({
						children: [options.prettyNames ? stripLabelPrefix(control) : control],
						expanded: false,
						label: thisPrefix,
						type: 'folder',
					})
				} else if (lastPrefix === thisPrefix) {
					// Add to folder
					const lastFolder = autoFolderControls.at(-1) as FolderPlan
					lastFolder.children.push(options.prettyNames ? stripLabelPrefix(control) : control)
				} else {
					// Push at top level
					autoFolderControls.push(control)
				}
			}

			return autoFolderControls
		}

		return controls
	}

	function updatePlanForStore(cssVariableKeys: string[] | undefined, options: Options) {
		controlPlan = []

		// Some horrible thing is messing up the order of the controls after
		// some are removed from a folder... this fixes it
		tick()
			.then(() => {
				controlPlan = getControlPlanFromStore(cssVariableKeys, options)
			})
			.catch(console.error)
	}

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
			// Allow exclusions via props
			.filter(
				(style: string) =>
					!exclude.some((excludeProperty) => cleanName(excludeProperty) === cleanName(style)),
			)

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
				copyCssToClipboard()
				break
			}

			case 'Reset': {
				resetCssVariables()
				break
			}

			default: {
				break
			}
		}
	}

	function copyCssToClipboard() {
		const directives = Object.entries($cssVariableStore).map(([variableName, value]) => {
			const units = getUnits(
				window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
			)
			return `\t${variableName}: ${value}${units ? `${units}` : ''};\n`
		})

		void copyToClipboard(`:root {\n${directives.join('')}}`, logPrefix)
	}

	function resetCssVariables() {
		console.log(`${logPrefix} Clearing changes to CSS Variables`)
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('css')
			location.reload()
		}
	}

	function resetOptions() {
		for (const key of Object.keys($expandedStateStore)) {
			$expandedStateStore[key] = true
		}

		$optionsStore = options
	}

	function updateCssVariableKeys(store: Record<string, number | string>) {
		if (!store) return
		const latestKeys = Object.keys(store)

		if (!arraysEqual(latestKeys, cssVariableKeys)) {
			cssVariableKeys = latestKeys
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

	let controlPlan: Plan[] = []
	let cssVariableKeys: string[] = []

	// $: $optionsStore = options
	$: updateCssVariableKeys($cssVariableStore)
	$: updatePlanForStore(cssVariableKeys, $optionsStore)
</script>

<Pane localStoreId="tweakpane-css" position={'draggable'} title="Tweakpane CSS">
	{#if cssVariableStore}
		{#each controlPlan as plan}
			{#if plan.type === 'folder'}
				<Folder bind:expanded={$expandedStateStore[getHash(plan.children)]} title={plan.label}>
					{#each plan.children as child}
						{#if child.type === 'control'}
							<AutoValue bind:value={$cssVariableStore[child.key]} label={child.label} />
						{/if}
					{/each}
				</Folder>
			{:else if plan.type === 'control'}
				<AutoValue bind:value={$cssVariableStore[plan.key]} label={plan.label} />
			{/if}
		{/each}
		<Separator />
		<ButtonGrid buttons={['Copy', 'Reset']} on:click={handleClick} />
		<Folder bind:expanded={$expandedStateStore[optionsExpandedStateKey]} title="Options">
			<AutoObject bind:object={$optionsStore} />
			<Button on:click={resetOptions} title="Reset Options" />
		</Folder>
	{/if}
</Pane>
