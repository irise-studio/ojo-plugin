import * as vscode from 'vscode';
import { normalizeUriGlobs } from './externalUriOpeners';

/**
 * 检查 URL 是否匹配任一 glob 模式。
 * 支持格式: https://ojo.art/**, https://*.aneway.ai/**, http://ojo.art/**
 */
function urlMatchesGlob(url: string, globs: string[]): boolean {
	try {
		const uri = vscode.Uri.parse(url);
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
	} catch {
		// 无效 URL
	}
	return false;
}

/** 匹配 http(s) URL 的正则 */
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

async function openInBuiltinBrowser(url: string): Promise<void> {
	const useIntegrated = await vscode.commands.getCommands(true).then((cmds) =>
		cmds.includes('workbench.action.browser.open')
	);
	if (useIntegrated) {
		await vscode.commands.executeCommand('workbench.action.browser.open', url);
	} else {
		await vscode.commands.executeCommand('simpleBrowser.show', url);
	}
}

/** 扩展 TerminalLink 以携带 URL */
class OjoTerminalLink extends vscode.TerminalLink {
	constructor(startIndex: number, length: number, readonly url: string) {
		super(startIndex, length, '在内置浏览器中打开');
	}
}

/**
 * 注册终端链接提供者：拦截 productUriGlobs 中的 URL，在内置浏览器中打开。
 * 使用稳定 API，不依赖 proposed API，可在 Cursor 等环境中正常运行。
 */
export function registerOjoUriOpener(context: vscode.ExtensionContext): void {
	const config = vscode.workspace.getConfiguration('ojoPlugin');
	const productUriGlobs = normalizeUriGlobs(config.get<unknown>('productUriGlobs', []));
	if (productUriGlobs.length === 0) {
		return;
	}

	const disposable = vscode.window.registerTerminalLinkProvider({
		provideTerminalLinks(context: vscode.TerminalLinkContext) {
			const links: OjoTerminalLink[] = [];
			const line = context.line;

			for (const match of line.matchAll(URL_REGEX)) {
				const url = match[0];
				if (urlMatchesGlob(url, productUriGlobs)) {
					links.push(new OjoTerminalLink(match.index!, url.length, url));
				}
			}
			return links;
		},
		async handleTerminalLink(link: OjoTerminalLink) {
			await openInBuiltinBrowser(link.url);
		},
	});

	context.subscriptions.push(disposable);
}
