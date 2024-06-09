export function stripPrefix(name: string): string {
	return name.split(' ').slice(1).join(' ')
}

export async function copyToClipboard(text: string, logPrefix = ''): Promise<void> {
	try {
		// eslint-disable-next-line n/no-unsupported-features/node-builtins
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
