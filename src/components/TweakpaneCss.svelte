<script context="module" lang="ts">
	// Suffix constants for light-dark variants
	const PRELOAD_LIGHT_SUFFIX = ':light'
	const PRELOAD_DARK_SUFFIX = ':dark'

	function getUnits(value: string): string | undefined {
		// Don't get confused by hex colors or complex expressions
		if (Number.isNaN(Number.parseFloat(value))) return ''
		// eslint-disable-next-line regexp/no-unused-capturing-group
		const match = /^(-?[\d.]+)\s?([%a-z]*)$/i.exec(value)
		return match?.[2]
	}

	function preloadReconstructLightDark(light: string, dark: string): string {
		return `light-dark(${light}, ${dark})`
	}

	function preloadGetBaseVariableName(key: string): string {
		if (key.endsWith(PRELOAD_LIGHT_SUFFIX)) {
			return key.slice(0, -PRELOAD_LIGHT_SUFFIX.length)
		}

		if (key.endsWith(PRELOAD_DARK_SUFFIX)) {
			return key.slice(0, -PRELOAD_DARK_SUFFIX.length)
		}

		return key
	}

	/**
	 * Apply any modified styles
	 */
	export function preload(): void {
		if (typeof localStorage !== 'undefined') {
			const cssVariables = localStorage.getItem('css')
			if (cssVariables) {
				const store = JSON.parse(cssVariables) as Record<string, number | string>
				// Using plain Set is appropriate here - this runs in module context before Svelte init
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				const processedBases = new Set<string>()

				for (const key of Object.keys(store)) {
					const baseKey = preloadGetBaseVariableName(key)

					// Skip if we've already processed this base variable
					if (processedBases.has(baseKey)) continue
					processedBases.add(baseKey)

					const lightKey = `${baseKey}${PRELOAD_LIGHT_SUFFIX}`
					const darkKey = `${baseKey}${PRELOAD_DARK_SUFFIX}`

					// Check if this is a light-dark variable
					if (lightKey in store && darkKey in store) {
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
						document.documentElement.style.setProperty(key, `${store[key]}${units ?? ''}`)
					}
				}
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
	let cssVariableStore: Writable<Record<string, StoreValue>>
	let optionsStore: Writable<Options> = persisted('css-options', options)
	let expandedStateStore: Writable<ExpandedState> = persisted('css-expanded-state', {
		optionsExpandedStateKey: false,
	})

	// Track which variables use light-dark() (populated during onMount)
	let lightDarkVariables: LightDarkMap = new SvelteSet()

	// Map of raw CSS values keyed by variable name (to detect light-dark before computed styles resolve them)
	let rawCssValues = new SvelteMap<string, string>()

	// Helper functions

	function stripLabelPrefix<T extends Plan>(plan: T): T {
		return {
			...plan,
			label: stripPrefix(plan.label),
		}
	}

	/**
	 * Get the base variable name without light/dark suffix
	 * @param key The variable name
	 * @returns The base variable name without light/dark suffix
	 */
	function getBaseVariableName(key: string): string {
		if (key.endsWith(LIGHT_SUFFIX)) {
			return key.slice(0, -LIGHT_SUFFIX.length)
		}

		if (key.endsWith(DARK_SUFFIX)) {
			return key.slice(0, -DARK_SUFFIX.length)
		}

		return key
	}

	/**
	 * Check if a key is a light or dark variant
	 * @param key The variable name
	 * @returns True if the key is a light or dark variant
	 */
	function isLightDarkKey(key: string): boolean {
		return key.endsWith(LIGHT_SUFFIX) || key.endsWith(DARK_SUFFIX)
	}

	/**
	 * Check if a store value is a cubic-bezier tuple
	 * @param value Stored value
	 * @returns True if the value is a cubic-bezier tuple
	 */
	function isCubicBezierTuple(value: StoreValue): value is [number, number, number, number] {
		return Array.isArray(value) && value.length === 4 && value.every((v) => typeof v === 'number')
	}

	/**
	 * Apply autoFolders grouping to a list of controls
	 * @param controls The controls to apply autoFolders to
	 * @param options The options for the autoFolders
	 * @returns The auto-folder controls
	 */
	function applyAutoFolders(controls: ControlPlan[], options: Options): Plan[] {
		if (!options.autoFolders || controls.length <= 1) {
			return controls
		}

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

	function getControlPlanFromStore(
		cssVariableKeys: string[] | undefined,
		options: Options,
	): Plan[] {
		if (cssVariableKeys === undefined) return []
		// Sort if needed
		const keys = options.sortNames ? cssVariableKeys.toSorted() : cssVariableKeys

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

				if (!options.includeCalculated && valueToCheck.includes('calc(')) {
					return accumulator
				}

				// Get units from the value
				const units = getUnits(valueToCheck)

				// Build the label, optionally stripping the :light/:dark suffix
				let displayKey = key
				if (stripSuffix) {
					displayKey = baseKey
				}

				return [
					...accumulator,
					{
						key,
						label: `${options.prettyNames ? cleanName(displayKey) : displayKey}${units && options.showUnits ? ` (${units})` : ''}`,
						type: 'control',
					},
				]
			}, [])

		// Build the plan
		const plan: Plan[] = []

		// Add Light folder if there are light-dark variables
		if (lightKeys.length > 0) {
			const lightControls = createControls(lightKeys, true)
			const lightContent = applyAutoFolders(lightControls, options)

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
			const darkContent = applyAutoFolders(darkControls, options)

			plan.push({
				children: darkContent.flatMap((item) => (item.type === 'folder' ? item.children : [item])),
				expanded: true,
				label: '🌙 Dark',
				type: 'folder',
			})
		}

		// Add regular controls (with autoFolders if enabled)
		const regularControls = createControls(regularKeys)
		const regularPlan = applyAutoFolders(regularControls, options)
		plan.push(...regularPlan)

		return plan
	}

	function updatePlanForStore(cssVariableKeys: string[] | undefined, options: Options) {
		controlPlan = []

		// Some horrible thing is messing up the order of the controls after
		// some are removed from a folder... this fixes it
		tick()
			.then(() => {
				controlPlan = getControlPlanFromStore(cssVariableKeys, options)
			})
			.catch((error: unknown) => {
				console.error(`${logPrefix} Error updating plan:`, error)
			})
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

	onMount(() => {
		// Get all root CSS rules and extract raw values
		const rootRules = [...document.styleSheets].flatMap((styleSheet) => [
			...getRootStyleRules(styleSheet.cssRules),
		])

		// Build a map of raw CSS values (before computed styles resolve light-dark)
		for (const rule of rootRules) {
			for (const property of rule.style) {
				if (property.startsWith('--')) {
					const rawValue = rule.style.getPropertyValue(property).trim()
					rawCssValues.set(property, rawValue)
				}
			}
		}

		// Get all the root css variable names
		const rootCssVariables: string[] = [...rawCssValues.keys()]
			// Allow exclusions via props
			.filter(
				(style: string) =>
					!exclude.some((excludeProperty) => cleanName(excludeProperty) === cleanName(style)),
			)

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

	function updateCssVariableKeys(store: Record<string, StoreValue>) {
		if (!store) return
		const latestKeys = Object.keys(store)

		if (!arraysEqual(latestKeys, cssVariableKeys)) {
			cssVariableKeys = latestKeys
		}
	}

	/**
	 * Get the final CSS value for a variable, handling light-dark and cubic-bezier reconstruction
	 * @param store The store to get the value from
	 * @param variableName The variable name to get the value for
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
		if (lightKey in store && darkKey in store) {
			const lightValue = String(store[lightKey])
			const darkValue = String(store[darkKey])
			return {
				value: reconstructLightDark(lightValue, darkValue),
				variableName,
			}
		}

		const storeValue = store[variableName]

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
	 * @param store The store to get the variables from
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
			if (processedBases.has(baseKey)) continue
			processedBases.add(baseKey)

			const processed = getFinalCssValue(store, baseKey)
			if (processed) {
				result.push(processed)
			}
		}

		return result
	}

	// Reactive
	$: if (cssVariableStore) {
		// Set the css variables on the document, handling light-dark reconstruction
		const processed = getAllProcessedCssVariables($cssVariableStore)
		for (const { value, variableName } of processed) {
			document.documentElement.style.setProperty(variableName, value)
		}
	}

	let controlPlan: Plan[] = []
	let cssVariableKeys: string[] = []

	// $: $optionsStore = options
	$: updateCssVariableKeys($cssVariableStore)
	$: updatePlanForStore(cssVariableKeys, $optionsStore)
</script>

<Pane localStoreId="tweakpane-css" position="draggable" title="Tweakpane CSS">
	{#if cssVariableStore}
		{#each controlPlan as plan}
			{#if plan.type === 'folder'}
				<Folder bind:expanded={$expandedStateStore[getHash(plan.children)]} title={plan.label}>
					{#each plan.children as child}
						{#if child.type === 'control'}
							{#if isColorString($cssVariableStore[child.key])}
								<ColorPlus
									bind:value={$cssVariableStore[child.key] as string}
									label={child.label}
								/>
							{:else if isCubicBezierTuple($cssVariableStore[child.key])}
								<CubicBezier
									bind:value={$cssVariableStore[child.key] as [number, number, number, number]}
									label={child.label}
								/>
							{:else}
								<AutoValue bind:value={$cssVariableStore[child.key]} label={child.label} />
							{/if}
						{/if}
					{/each}
				</Folder>
			{:else if plan.type === 'control'}
				{#if isColorString($cssVariableStore[plan.key])}
					<ColorPlus bind:value={$cssVariableStore[plan.key] as string} label={plan.label} />
				{:else if isCubicBezierTuple($cssVariableStore[plan.key])}
					<CubicBezier
						bind:value={$cssVariableStore[plan.key] as [number, number, number, number]}
						label={plan.label}
					/>
				{:else}
					<AutoValue bind:value={$cssVariableStore[plan.key]} label={plan.label} />
				{/if}
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
