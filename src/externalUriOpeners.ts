import * as vscode from 'vscode';

const SIMPLE_BROWSER_OPENER_ID = 'simpleBrowser.open';

export function normalizeUriGlobs(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

export function mergeExternalUriOpeners(
	existing: Record<string, unknown>,
	productUriGlobs: string[],
): { changed: boolean; value: Record<string, unknown> } {
	const merged: Record<string, unknown> = { ...existing };
	let changed = false;

	for (const glob of productUriGlobs) {
		if (glob in merged) {
			continue;
		}
		merged[glob] = SIMPLE_BROWSER_OPENER_ID;
		changed = true;
	}

	return {
		changed,
		value: merged,
	};
}

export async function ensureProductDomainsUseBuiltinBrowser(productUriGlobs: string[]): Promise<void> {
	if (productUriGlobs.length === 0) {
		return;
	}

	const config = vscode.workspace.getConfiguration('workbench');
	const existing = config.get<Record<string, unknown>>('externalUriOpeners') ?? {};

	const merged = mergeExternalUriOpeners(existing, productUriGlobs);
	if (!merged.changed) {
		return;
	}

	await config.update('externalUriOpeners', merged.value, vscode.ConfigurationTarget.Global);
}
