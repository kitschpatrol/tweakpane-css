<script context="module" lang="ts">
	// Suffix constants for light-dark variants
	const PRELOAD_LIGHT_SUFFIX = ':light'
	const PRELOAD_DARK_SUFFIX = ':dark'
	// eslint-disable-next-line regexp/no-unused-capturing-group
	const UNITS_REGEX = /^(-?[\d.]+)\s?([%a-z]*)$/iu

	function getUnits(value: string): string | undefined {
		// Don't get confused by hex colors or complex expressions
		// Number.parseFloat intentionally accepts CSS values such as `12px`.
		// eslint-disable-next-line unicorn/prefer-number-coercion
		if (Number.isNaN(Number.parseFloat(value))) {
			return ''
		}

		const match = UNITS_REGEX.exec(value)
		return match?.[2]
	}

	function preloadReconstructLightDark(light: string, dark: string): string {
		return `light-dark(${light}, ${dark})`
	}

	function preloadGetBaseVariableName(key: string): string {
		if (key.endsWith(PRELOAD_LIGHT_SUFFIX)) {
			return key.slice(0, -PRELOAD_LIGHT_SUFFIX.length)
		}

		return key.endsWith(PRELOAD_DARK_SUFFIX) ? key.slice(0, -PRELOAD_DARK_SUFFIX.length) : key
	}

	/**
	 * Apply any modified styles
	 */
	export function preload(): void {
		if (typeof localStorage === 'undefined') {
			return
		}

		const cssVariables = localStorage.getItem('css')
		if (cssVariables === null || cssVariables === '') {
			return
		}

		const store = JSON.parse(cssVariables) as Record<string, number | string>
		// Using plain Set is appropriate here - this runs in module context before Svelte init
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const processedBases = new Set<string>()

		for (const [key, storedValue] of Object.entries(store)) {
			const baseKey = preloadGetBaseVariableName(key)

			// Skip if we've already processed this base variable
			if (processedBases.has(baseKey)) {
				continue
			}

			processedBases.add(baseKey)

			const lightKey = `${baseKey}${PRELOAD_LIGHT_SUFFIX}`
			const darkKey = `${baseKey}${PRELOAD_DARK_SUFFIX}`

			// Check if this is a light-dark variable
			if (Object.hasOwn(store, lightKey) && Object.hasOwn(store, darkKey)) {
				const lightValue = String(store[lightKey])
				const darkValue = String(store[darkKey])
				document.documentElement.style.setProperty(
					baseKey,
					preloadReconstructLightDark(lightValue, darkValue),
				)
			} else if (!key.endsWith(PRELOAD_LIGHT_SUFFIX) && !key.endsWith(PRELOAD_DARK_SUFFIX)) {
				// Regular variable
				const units = getUnits(
					window.getComputedStyle(document.documentElement).getPropertyValue(key),
				)
				document.documentElement.style.setProperty(key, `${storedValue}${units ?? ''}`)
			}
		}
	}
</script>

<script lang="ts">
	import type { ButtonGridClickEvent } from 'svelte-tweakpane-ui/ButtonGrid.svelte'
	import type { Writable } from 'svelte/store'
	import { onMount, tick } from 'svelte'
	import { persisted } from 'svelte-persisted-store'
	import AutoObject from 'svelte-tweakpane-ui/AutoObject.svelte'
	import AutoValue from 'svelte-tweakpane-ui/AutoValue.svelte'
	import Button from 'svelte-tweakpane-ui/Button.svelte'
	import ButtonGrid from 'svelte-tweakpane-ui/ButtonGrid.svelte'
	import ColorPlus from 'svelte-tweakpane-ui/ColorPlus.svelte'
	import CubicBezier from 'svelte-tweakpane-ui/CubicBezier.svelte'
	import Folder from 'svelte-tweakpane-ui/Folder.svelte'
	import Pane from 'svelte-tweakpane-ui/Pane.svelte'
	import Separator from 'svelte-tweakpane-ui/Separator.svelte'
	import { SvelteMap, SvelteSet } from 'svelte/reactivity'
	import { writable } from 'svelte/store'
	import {
		arraysEqual,
		cleanName,
		copyToClipboard,
		getHash,
		isColorString,
		isCubicBezierString,
		isLightDarkValue,
		parseCubicBezier,
		parseLightDark,
		parseNumberOrReturnOriginal,
		reconstructCubicBezier,
		reconstructLightDark,
		stripPrefix,
	} from '../utilities'

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

	// Suffix used to identify light-dark variants in the store
	const LIGHT_SUFFIX = ':light'
	const DARK_SUFFIX = ':dark'

	// Track which original variable names use light-dark()
	// Key is the original variable name (e.g. '--background-color')
	// Value indicates this variable uses light-dark() function
	type LightDarkMap = Set<string>

	// Defaults
	const logPrefix = '[tweakpane-css]'
	const defaultOptions: Options = {
		autoFolders: false,
		includeCalculated: false,
		prettyNames: true,
		showUnits: true,
		sortNames: false,
	}
	const optionsExpandedStateKey = 'tweakpane-css-options-05860cf2958c'

	// Props
	export let exclude: string[] = []
	export let options: Options = defaultOptions

	// Store value type includes tuple for cubic-bezier
	type StoreValue = [number, number, number, number] | number | string

	// Stores
	let cssVariableStore = writable<Record<string, StoreValue>>({})
	let isCssVariableStoreReady = false
	const optionsStore: Writable<Options> = persisted('css-options', options)
	const expandedStateStore: Writable<ExpandedState> = persisted('css-expanded-state', {
		[optionsExpandedStateKey]: false,
	})

	// Track which variables use light-dark() (populated during onMount)
	const lightDarkVariables: LightDarkMap = new SvelteSet()

	// Map of raw CSS values keyed by variable name (to detect light-dark before computed styles resolve them)
	const rawCssValues = new SvelteMap<string, string>()

	// Helper functions

	function stripLabelPrefix<T extends Plan>(plan: T): T {
		return {
			...plan,
			label: stripPrefix(plan.label),
		}
	}

	/**
	 * Get the base variable name without light/dark suffix
	 *
	 * @param key The variable name
	 *
	 * @returns The base variable name without light/dark suffix
	 */
	function getBaseVariableName(key: string): string {
		if (key.endsWith(LIGHT_SUFFIX)) {
			return key.slice(0, -LIGHT_SUFFIX.length)
		}

		return key.endsWith(DARK_SUFFIX) ? key.slice(0, -DARK_SUFFIX.length) : key
	}

	/**
	 * Check if a key is a light or dark variant
	 *
	 * @param key The variable name
	 *
	 * @returns True if the key is a light or dark variant
	 */
	function isLightDarkKey(key: string): boolean {
		return key.endsWith(LIGHT_SUFFIX) || key.endsWith(DARK_SUFFIX)
	}

	/**
	 * Check if a store value is a cubic-bezier tuple
	 *
	 * @param value Stored value
	 *
	 * @returns True if the value is a cubic-bezier tuple
	 */
	function isCubicBezierTuple(value: unknown): value is [number, number, number, number] {
		return Array.isArray(value) && value.length === 4 && value.every((v) => typeof v === 'number')
	}

	function getControlPrefix(control: ControlPlan): string {
		return cleanName(control.key).split(' ', 1)[0] ?? ''
	}

	/**
	 * Apply autoFolders grouping to a list of controls
	 *
	 * @param controls The controls to apply autoFolders to
	 * @param currentOptions The options for the autoFolders
	 *
	 * @returns The auto-folder controls
	 */
	function applyAutoFolders(controls: ControlPlan[], currentOptions: Options): Plan[] {
		if (!currentOptions.autoFolders || controls.length <= 1) {
			return controls
		}

		const autoFolderControls: Plan[] = []

		for (const [index, control] of controls.entries()) {
			const lastControl = index === 0 ? undefined : controls.at(index - 1)
			const nextControl = controls.at(index + 1)
			const lastPrefix = lastControl === undefined ? undefined : getControlPrefix(lastControl)
			const thisPrefix = getControlPrefix(control)
			const nextPrefix = nextControl === undefined ? undefined : getControlPrefix(nextControl)

			if (thisPrefix === nextPrefix && lastPrefix !== thisPrefix) {
				// Start folder
				autoFolderControls.push({
					children: [currentOptions.prettyNames ? stripLabelPrefix(control) : control],
					expanded: false,
					label: thisPrefix,
					type: 'folder',
				})
			} else if (lastPrefix === thisPrefix) {
				// Add to folder
				const lastFolder = autoFolderControls.at(-1) as FolderPlan
				lastFolder.children.push(currentOptions.prettyNames ? stripLabelPrefix(control) : control)
			} else {
				// Push at top level
				autoFolderControls.push(control)
			}
		}

		return autoFolderControls
	}

	function getControlPlanFromStore(
		cssVariableKeys: string[] | undefined,
		currentOptions: Options,
	): Plan[] {
		if (cssVariableKeys === undefined) {
			return []
		}

		// Sort if needed
		const keys = currentOptions.sortNames ? cssVariableKeys.toSorted() : cssVariableKeys

		// Separate light-dark keys from regular keys
		const lightKeys: string[] = []
		const darkKeys: string[] = []
		const regularKeys: string[] = []

		for (const key of keys) {
			if (key.endsWith(LIGHT_SUFFIX)) {
				lightKeys.push(key)
			} else if (key.endsWith(DARK_SUFFIX)) {
				darkKeys.push(key)
			} else {
				regularKeys.push(key)
			}
		}

		// Helper to create controls from keys
		const createControls = (keysToProcess: string[], stripSuffix = false): ControlPlan[] =>
			keysToProcess.reduce<ControlPlan[]>((accumulator, key) => {
				// Get the raw value for calc() check (use base name for light-dark vars)
				const baseKey = getBaseVariableName(key)
				const rawValue = rawCssValues.get(baseKey) ?? ''

				// For light-dark variables, check the inner value for calc()
				let valueToCheck = rawValue
				if (isLightDarkKey(key) && isLightDarkValue(rawValue)) {
					const parsed = parseLightDark(rawValue)
					if (parsed) {
						valueToCheck = key.endsWith(LIGHT_SUFFIX) ? parsed.light : parsed.dark
					}
				}

				if (!currentOptions.includeCalculated && valueToCheck.includes('calc(')) {
					return accumulator
				}

				// Get units from the value
				const units = getUnits(valueToCheck)

				// Build the label, optionally stripping the :light/:dark suffix
				const displayKey = stripSuffix ? baseKey : key

				return [
					...accumulator,
					{
						key,
						label: `${currentOptions.prettyNames ? cleanName(displayKey) : displayKey}${units !== undefined && units !== '' && currentOptions.showUnits === true ? ` (${units})` : ''}`,
						type: 'control',
					},
				]
			}, [])

		// Build the plan
		const plan: Plan[] = []

		// Add Light folder if there are light-dark variables
		if (lightKeys.length > 0) {
			const lightControls = createControls(lightKeys, true)
			const lightContent = applyAutoFolders(lightControls, currentOptions)

			plan.push({
				children: lightContent.flatMap((item) => (item.type === 'folder' ? item.children : [item])),
				expanded: true,
				label: '☀️ Light',
				type: 'folder',
			})
		}

		// Add Dark folder if there are light-dark variables
		if (darkKeys.length > 0) {
			const darkControls = createControls(darkKeys, true)
			const darkContent = applyAutoFolders(darkControls, currentOptions)

			plan.push({
				children: darkContent.flatMap((item) => (item.type === 'folder' ? item.children : [item])),
				expanded: true,
				label: '🌙 Dark',
				type: 'folder',
			})
		}

		// Add regular controls (with autoFolders if enabled)
		const regularControls = createControls(regularKeys)
		const regularPlan = applyAutoFolders(regularControls, currentOptions)
		plan.push(...regularPlan)

		return plan
	}

	async function updatePlanForStore(
		cssVariableKeys: string[] | undefined,
		currentOptions: Options,
	): Promise<void> {
		// Remount every control instead of letting the keyed each blocks move
		// them: svelte-tweakpane-ui fixes a blade's index in the pane when it
		// mounts, so a moved DOM node leaves its blade in the old position.
		controlPlan = []

		try {
			await tick()
			controlPlan = getControlPlanFromStore(cssVariableKeys, currentOptions)
		} catch (error) {
			console.error(`${logPrefix} Error updating plan:`, error)
		}
	}

	// Recursively extract :root style rules (handles @layer, @media, @supports, etc.)
	function* getRootStyleRules(rules: CSSRuleList): Generator<CSSStyleRule> {
		for (const rule of rules) {
			if (
				rule instanceof CSSStyleRule &&
				rule.selectorText.split(',').some((s) => s.trim() === ':root')
			) {
				yield rule
			}

			if (rule instanceof CSSGroupingRule) {
				yield* getRootStyleRules(rule.cssRules)
			}
		}
	}

	function addRawCssValues(rule: CSSStyleRule): void {
		for (const property of rule.style) {
			if (!property.startsWith('--')) {
				continue
			}

			const rawValue = rule.style.getPropertyValue(property).trim()
			rawCssValues.set(property, rawValue)
		}
	}

	onMount(() => {
		// Get all root CSS rules and extract raw values
		const rootRules = [...document.styleSheets].flatMap((styleSheet) => [
			...getRootStyleRules(styleSheet.cssRules),
		])

		// Build a map of raw CSS values (before computed styles resolve light-dark)
		for (const rule of rootRules) {
			addRawCssValues(rule)
		}

		// Get all the root css variable names
		const rootCssVariables: string[] = rawCssValues
			.keys()
			// Allow exclusions via props
			.filter((style: string) =>
				exclude.every((excludeProperty) => cleanName(excludeProperty) !== cleanName(style)),
			)
			.toArray()

		// Build the initial store values, handling light-dark() and cubic-bezier() functions
		const initialStoreValues: Record<string, StoreValue> = {}
		const storeKeys: string[] = []

		for (const variableName of rootCssVariables) {
			const rawValue = rawCssValues.get(variableName) ?? ''

			if (isLightDarkValue(rawValue)) {
				// Parse light-dark() and create separate entries
				const parsed = parseLightDark(rawValue)
				if (parsed) {
					lightDarkVariables.add(variableName)
					const lightKey = `${variableName}${LIGHT_SUFFIX}`
					const darkKey = `${variableName}${DARK_SUFFIX}`
					initialStoreValues[lightKey] = parseNumberOrReturnOriginal(parsed.light)
					initialStoreValues[darkKey] = parseNumberOrReturnOriginal(parsed.dark)
					storeKeys.push(lightKey, darkKey)
				}
			} else if (isCubicBezierString(rawValue)) {
				// Parse cubic-bezier() and store as tuple
				const parsed = parseCubicBezier(rawValue)
				if (parsed) {
					initialStoreValues[variableName] = parsed
					storeKeys.push(variableName)
				}
			} else {
				// Regular CSS variable
				initialStoreValues[variableName] = parseNumberOrReturnOriginal(
					window.getComputedStyle(document.documentElement).getPropertyValue(variableName),
				)
				storeKeys.push(variableName)
			}
		}

		// Set up the persistent local store
		cssVariableStore = persisted('css', initialStoreValues)

		// Clean up stale keys in the store
		for (const key of Object.keys($cssVariableStore)) {
			if (!storeKeys.includes(key)) {
				// TODO revisit $?

				// eslint-disable-next-line ts/no-dynamic-delete
				delete $cssVariableStore[key]
			}
		}

		isCssVariableStoreReady = true
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
		const processed = getAllProcessedCssVariables($cssVariableStore)
		const directives = processed.map(({ value, variableName }) => `\t${variableName}: ${value};\n`)

		void copyToClipboard(`:root {\n${directives.join('')}}`, logPrefix)
	}

	function resetCssVariables() {
		console.log(`${logPrefix} Clearing changes to CSS Variables`)

		if (typeof localStorage === 'undefined') {
			return
		}

		localStorage.removeItem('css')
		location.reload()
	}

	function resetOptions() {
		for (const key of Object.keys($expandedStateStore)) {
			$expandedStateStore[key] = true
		}

		$optionsStore = options
	}

	function updateCssVariableKeys(store: Record<string, StoreValue>) {
		const latestKeys = Object.keys(store)

		if (!arraysEqual(latestKeys, cssVariableKeys)) {
			cssVariableKeys = latestKeys
		}
	}

	/**
	 * Get the final CSS value for a variable, handling light-dark and
	 * cubic-bezier reconstruction
	 *
	 * @param store The store to get the value from
	 * @param variableName The variable name to get the value for
	 *
	 * @returns The final CSS value for the variable
	 */
	function getFinalCssValue(
		store: Record<string, StoreValue>,
		variableName: string,
	): undefined | { value: string; variableName: string } {
		// Skip light/dark suffixed keys - they're handled via their base variable
		if (variableName.endsWith(LIGHT_SUFFIX) || variableName.endsWith(DARK_SUFFIX)) {
			return undefined
		}

		const lightKey = `${variableName}${LIGHT_SUFFIX}`
		const darkKey = `${variableName}${DARK_SUFFIX}`

		// Check if this variable has light-dark variants in the store
		if (Object.hasOwn(store, lightKey) && Object.hasOwn(store, darkKey)) {
			const lightValue = String(store[lightKey])
			const darkValue = String(store[darkKey])
			return {
				value: reconstructLightDark(lightValue, darkValue),
				variableName,
			}
		}

		const storeValue = store[variableName]
		if (storeValue === undefined) {
			return undefined
		}

		// Check if this is a cubic-bezier array
		if (isCubicBezierTuple(storeValue)) {
			return {
				value: reconstructCubicBezier(storeValue),
				variableName,
			}
		}

		// Regular variable - get units and construct value
		const rawValue = rawCssValues.get(variableName) ?? ''
		const units = getUnits(rawValue)
		return {
			value: `${storeValue}${units ?? ''}`,
			variableName,
		}
	}

	/**
	 * Get all processed CSS variables, grouping light-dark pairs
	 *
	 * @param store The store to get the variables from
	 *
	 * @returns The processed CSS variables
	 */
	function getAllProcessedCssVariables(
		store: Record<string, StoreValue>,
	): Array<{ value: string; variableName: string }> {
		const result: Array<{ value: string; variableName: string }> = []
		const processedBases = new SvelteSet<string>()

		for (const key of Object.keys(store)) {
			const baseKey = getBaseVariableName(key)

			// Skip if we've already processed this base variable
			if (processedBases.has(baseKey)) {
				continue
			}

			processedBases.add(baseKey)

			const processed = getFinalCssValue(store, baseKey)
			if (processed) {
				result.push(processed)
			}
		}

		return result
	}

	// Reactive
	$: if (isCssVariableStoreReady) {
		// Set the css variables on the document, handling light-dark reconstruction
		const processed = getAllProcessedCssVariables($cssVariableStore)
		for (const { value, variableName } of processed) {
			document.documentElement.style.setProperty(variableName, value)
		}
	}

	let controlPlan: Plan[] = []
	let cssVariableKeys: string[] = []

	// $: $optionsStore = options
	$: if (isCssVariableStoreReady) {
		updateCssVariableKeys($cssVariableStore)
	}
	$: if (isCssVariableStoreReady) {
		void updatePlanForStore(cssVariableKeys, $optionsStore)
	}
</script>

<div
	// Shield the pane from styles the host page lets its children inherit (e.g. a
	// `pointer-events: none` body), without adding a box to the host page layout.
	// TODO Remove after the next svelte-tweakpane-ui point release (> 1.6.0), which
	// sets `pointer-events: auto` on draggable and fixed panes. Removing it also drops
	// the reset of other inherited styles such as `user-select` and `text-transform`.
	style:all="initial"
	style:display="contents"
>
	<Pane localStoreId="tweakpane-css" position="draggable" title="Tweakpane CSS">
		{#if isCssVariableStoreReady}
			{#each controlPlan as plan (plan.type === 'folder' ? getHash(plan.children) : plan.key)}
				{#if plan.type === 'folder'}
					<Folder title={plan.label} bind:expanded={$expandedStateStore[getHash(plan.children)]}>
						{#each plan.children as child (child.key)}
							{#if isColorString($cssVariableStore[child.key])}
								<ColorPlus
									label={child.label}
									bind:value={$cssVariableStore[child.key] as string}
								/>
							{:else if isCubicBezierTuple($cssVariableStore[child.key])}
								<CubicBezier
									label={child.label}
									bind:value={$cssVariableStore[child.key] as [number, number, number, number]}
								/>
							{:else}
								<AutoValue label={child.label} bind:value={$cssVariableStore[child.key]!} />
							{/if}
						{/each}
					</Folder>
				{:else if plan.type === 'control'}
					{#if isColorString($cssVariableStore[plan.key])}
						<ColorPlus label={plan.label} bind:value={$cssVariableStore[plan.key] as string} />
					{:else if isCubicBezierTuple($cssVariableStore[plan.key])}
						<CubicBezier
							label={plan.label}
							bind:value={$cssVariableStore[plan.key] as [number, number, number, number]}
						/>
					{:else}
						<AutoValue label={plan.label} bind:value={$cssVariableStore[plan.key]!} />
					{/if}
				{/if}
			{/each}
			<Separator />
			<ButtonGrid buttons={['Copy', 'Reset']} on:click={handleClick} />
			<!-- Two-way binding must write through to the keyed expansion-state record. -->
			<!-- eslint-disable-next-line svelte/prefer-destructured-store-props -->
			<Folder title="Options" bind:expanded={$expandedStateStore[optionsExpandedStateKey]}>
				<AutoObject bind:object={$optionsStore} />
				<Button title="Reset Options" on:click={resetOptions} />
			</Folder>
		{/if}
	</Pane>
</div>
