/* eslint-disable jsdoc/require-jsdoc */

import parse from 'color-parse'

export function stripPrefix(name: string): string {
	return name.split(' ').slice(1).join(' ')
}

export async function copyToClipboard(text: string, logPrefix = ''): Promise<void> {
	try {
		// eslint-disable-next-line node/no-unsupported-features/node-builtins
		await navigator.clipboard.writeText(text)
		console.log(`${logPrefix} Copied to clipboard:\n${text}`)
	} catch (error) {
		console.error(`${logPrefix} Failed to copy text: ${String(error)}`)
	}
}

export function parseNumberOrReturnOriginal(text: string): number | string {
	// Also strips suffixed units
	const parsed = Number.parseFloat(text)
	return Number.isNaN(parsed) ? text : parsed
}

export function getHash(children: Array<Record<string, unknown>>): string {
	const rawKeyString = children.map((child) => child.key).join('')
	// TODO Hash the key string
	return rawKeyString
}

export function arraysEqual<T>(a: T[], b: T[]): boolean {
	return a.length === b.length && a.every((value, index) => value === b[index])
}

export function cleanName(name: string): string {
	return name
		.replace('--', '')
		.replaceAll('-', ' ')
		.replaceAll(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase())
}

// TODO this needs to be more robust
export function isColorString(value: unknown): boolean {
	if (typeof value !== 'string') return false
	const { values } = parse(value)
	return values.length > 0
}

/**
 * Check if a CSS value contains a light-dark() function
 */
export function isLightDarkValue(value: string): boolean {
	return value.trim().startsWith('light-dark(')
}

/**
 * Parse a light-dark() CSS function into its light and dark components
 * @example parseLightDark('light-dark(oklch(100% 0 0deg), oklch(16.84% 0 0deg))')
 * // Returns { light: 'oklch(100% 0 0deg)', dark: 'oklch(16.84% 0 0deg)' }
 */
export function parseLightDark(value: string): undefined | { dark: string; light: string } {
	const trimmed = value.trim()
	if (!trimmed.startsWith('light-dark(') || !trimmed.endsWith(')')) {
		return undefined
	}

	// Extract the inner content between 'light-dark(' and the final ')'
	const inner = trimmed.slice('light-dark('.length, -1)

	// Parse the two arguments, respecting nested parentheses
	let depth = 0
	let commaIndex = -1

	// Iterate by Unicode code points (not UTF-16 code units)
	// eslint-disable-next-line unicorn/prefer-spread
	for (const [i, char] of Array.from(inner).entries()) {
		if (char === '(') {
			depth++
		} else if (char === ')') {
			depth--
		} else if (char === ',' && depth === 0) {
			commaIndex = i
			break
		}
	}

	if (commaIndex === -1) {
		return undefined
	}

	const light = inner.slice(0, commaIndex).trim()
	const dark = inner.slice(commaIndex + 1).trim()

	return { dark, light }
}

/**
 * Reconstruct a light-dark() CSS function from light and dark values
 */
export function reconstructLightDark(light: string, dark: string): string {
	return `light-dark(${light}, ${dark})`
}

/**
 * Check if a CSS value is a cubic-bezier() function
 */
export function isCubicBezierString(value: unknown): boolean {
	if (typeof value !== 'string') return false
	return /^cubic-bezier\(\s*[\d.]+\s*,\s*[\d.-]+\s*,\s*[\d.]+\s*,\s*[\d.-]+\s*\)$/i.test(
		value.trim(),
	)
}

/**
 * Parse a cubic-bezier() CSS function into an array of 4 numbers
 * @example parseCubicBezier('cubic-bezier(0.25, 0.1, 0.25, 1)')
 * // Returns [0.25, 0.1, 0.25, 1]
 */
export function parseCubicBezier(value: string): [number, number, number, number] | undefined {
	const match =
		/^cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.-]+)\s*,\s*([\d.]+)\s*,\s*([\d.-]+)\s*\)$/i.exec(
			value.trim(),
		)
	if (!match) return undefined
	return [
		Number.parseFloat(match[1]),
		Number.parseFloat(match[2]),
		Number.parseFloat(match[3]),
		Number.parseFloat(match[4]),
	]
}

/**
 * Convert an array of 4 numbers to a cubic-bezier() CSS function string
 */
export function reconstructCubicBezier(values: [number, number, number, number]): string {
	return `cubic-bezier(${values.join(', ')})`
}
