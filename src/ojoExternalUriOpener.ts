import * as vscode from 'vscode';
import { normalizeUriGlobs } from './externalUriOpeners';

const OJO_OPENER_ID = 'ojo-plugin.builtinBrowser';

/**
 * 检查 URL 是否匹配任一 glob 模式。
 * 支持格式: https://ojo.art/**, https://*.aneway.ai/**, http://ojo.art/**
 */
function urlMatchesGlob(uri: vscode.Uri, globs: string[]): boolean {
	const scheme = uri.scheme;
	const host = uri.authority?.split(':')[0] ?? '';

	for (const glob of globs) {
		const match = glob.match(/^(https?):\/\/([^/]+)(\/\*\*)?$/);
		if (!match) {
			continue;
		}

		const [, gScheme, gHost] = match;
		if (gScheme !== scheme) {
			continue;
		}

		if (gHost === host) {
			return true;
		}
		if (gHost.startsWith('*.')) {
			const suffix = gHost.slice(1);
			if (host === suffix.slice(1) || host.endsWith(suffix)) {
				return true;
			}
		}
	}
	return false;
}

async function openInBuiltinBrowser(url: string): Promise<void> {
	const useIntegrated = await vscode.commands.getCommands(true).then((cmds) =>
		cmds.includes('workbench.action.browser.open'),
	);
	if (useIntegrated) {
		await vscode.commands.executeCommand('workbench.action.browser.open', url);
	} else {
		await vscode.commands.executeCommand('simpleBrowser.show', url);
	}
}

/**
 * 注册 ExternalUriOpener，使 Cursor 右侧面板（Chat/Composer）等处的链接点击时在内置浏览器中打开。
 * 使用 proposed API registerExternalUriOpener，当 API 可用时自动生效；不可用时回退到 workbench.externalUriOpeners 配置。
 */
export function registerOjoExternalUriOpener(context: vscode.ExtensionContext): void {
	const config = vscode.workspace.getConfiguration('ojoPlugin');
	const productUriGlobs = normalizeUriGlobs(config.get<unknown>('productUriGlobs', []));
	if (productUriGlobs.length === 0) {
		return;
	}

	type RegisterFn = (
		id: string,
		opener: vscode.ExternalUriOpener,
		metadata: { schemes: readonly string[]; label: string },
	) => vscode.Disposable;
	const registerFn = (vscode.window as unknown as { registerExternalUriOpener?: RegisterFn }).registerExternalUriOpener;
	if (typeof registerFn !== 'function') {
		return;
	}

	const opener: vscode.ExternalUriOpener = {
		canOpenExternalUri(uri: vscode.Uri) {
			if (uri.scheme !== 'http' && uri.scheme !== 'https') {
				return vscode.ExternalUriOpenerPriority.None;
			}
			return urlMatchesGlob(uri, productUriGlobs)
				? vscode.ExternalUriOpenerPriority.Preferred
				: vscode.ExternalUriOpenerPriority.None;
		},
		async openExternalUri(resolvedUri: vscode.Uri) {
			await openInBuiltinBrowser(resolvedUri.toString());
		},
	};

	const disposable = registerFn.call(vscode.window, OJO_OPENER_ID, opener, {
		schemes: ['http', 'https'],
		label: '在内置浏览器中打开 (Ojo)',
	});

	context.subscriptions.push(disposable);
}
