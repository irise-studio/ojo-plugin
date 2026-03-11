import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import * as vscode from 'vscode';
import { AuthStateProvider } from './authStateProvider';
import { ensureProductDomainsUseBuiltinBrowser, normalizeUriGlobs } from './externalUriOpeners';
import { registerOjoUriOpener } from './ojoUriOpener';
import { registerOjoExternalUriOpener } from './ojoExternalUriOpener';
import { buildIdeLaunchQueryParams, detectIdeClient, generateSyncToken } from './ideContext';
import { resolveWebLaunchUrl } from './webHandoff';
import {
	internalErrorResponse,
	invalidRequestResponse,
	invalidTokenResponse,
	isAllowedOrigin,
	originNotAllowedResponse,
	parseSyncRequestBody,
	runWorkspaceSync,
	syncInProgressResponse,
	type SyncResponse,
} from './workspaceSync';

let server: Server | undefined;
let listeningPort = 37123;
let activeSyncToken: string | undefined;
let syncInProgress = false;
const authStateProvider = new AuthStateProvider();

export function activate(context: vscode.ExtensionContext) {
	try {
		void vscode.window.showInformationMessage('Ojo 插件已启动');
		console.log('Congratulations, your extension "ojo-plugin" is now active!');

		void configureBuiltinBrowserOpeners();
		registerOjoUriOpener(context);
		registerOjoExternalUriOpener(context);
		startServer();

		const config = vscode.workspace.getConfiguration('ojoPlugin');
		if (config.get<boolean>('autoOpenBrowserOnActivate', true)) {
			void openWebInBuiltinBrowser();
		}

		const disposable = vscode.commands.registerCommand('ojo-plugin.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from ojo-plugin!');
		});
		const openWebDisposable = vscode.commands.registerCommand('ojo-plugin.openWeb', async () => {
			await openWebWithOptionalTicket();
		});

		// 状态栏项：保持扩展常驻，便于用户快速打开 Web
		const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		statusBarItem.command = 'ojo-plugin.openWeb';
		statusBarItem.text = '$(globe) Ojo';
		statusBarItem.tooltip = 'Ojo: 打开 Web 并同步登录';
		statusBarItem.show();
		context.subscriptions.push(statusBarItem);

		context.subscriptions.push(disposable);
		context.subscriptions.push(openWebDisposable);
	} catch (err) {
		void vscode.window.showErrorMessage(`Ojo 插件启动失败: ${String(err)}`);
		throw err;
	}
}

async function configureBuiltinBrowserOpeners() {
	const config = vscode.workspace.getConfiguration('ojoPlugin');
	const productUriGlobs = normalizeUriGlobs(config.get<unknown>('productUriGlobs', []));
	if (productUriGlobs.length === 0) {
		return;
	}

	try {
		await ensureProductDomainsUseBuiltinBrowser(productUriGlobs);
	} catch (error) {
		console.warn('[ojo-plugin] failed to configure workbench.externalUriOpeners', error);
	}
}

function startServer() {
	if (server) {
		return;
	}

	const config = vscode.workspace.getConfiguration('ojoPlugin');
	const port = config.get<number>('serverPort', 37123);
	listeningPort = port;

	server = createServer((req, res) => {
		void handleServerRequest(req, res);
	});

	server.on('error', (error) => {
		vscode.window.showErrorMessage(`ojo-plugin server failed: ${String(error)}`);
	});

	server.listen(port, '127.0.0.1', () => {
		console.log(`[ojo-plugin] server listening on http://127.0.0.1:${port}`);
	});
}

function getRequestPath(req: IncomingMessage): string {
	try {
		return new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
	} catch {
		return '/';
	}
}

function getRequestOrigin(req: IncomingMessage): string | undefined {
	const raw = req.headers.origin;
	if (!raw) {
		return undefined;
	}
	return Array.isArray(raw) ? raw[0] : raw;
}

function writeCorsHeaders(res: ServerResponse, origin: string | undefined): void {
	if (!origin) {
		return;
	}
	res.setHeader('Access-Control-Allow-Origin', origin);
	res.setHeader('Vary', 'Origin');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ojo-ide-token, x-ojo-request-id');
	res.setHeader('Access-Control-Allow-Private-Network', 'true');
}

function writeSyncResponse(res: ServerResponse, response: SyncResponse, origin: string | undefined): void {
	writeCorsHeaders(res, origin);
	res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8' });
	if (response.ok) {
		res.end(JSON.stringify({ ok: true, data: response.data }));
		return;
	}
	res.end(JSON.stringify({ ok: false, error: response.error }));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}
	if (chunks.length === 0) {
		return {};
	}
	const payloadText = Buffer.concat(chunks).toString('utf8');
	return JSON.parse(payloadText);
}

async function handleWorkspaceSync(req: IncomingMessage, res: ServerResponse): Promise<void> {
	const config = vscode.workspace.getConfiguration('ojoPlugin');
	const webBaseUrl = config.get<string>('webBaseUrl', 'https://aneway.ai');
	const origin = getRequestOrigin(req);

	if (!isAllowedOrigin(origin, webBaseUrl)) {
		writeSyncResponse(res, originNotAllowedResponse(), undefined);
		return;
	}

	if (req.method === 'OPTIONS') {
		writeCorsHeaders(res, origin);
		res.writeHead(204);
		res.end();
		return;
	}

	if (req.method !== 'POST') {
		writeSyncResponse(res, invalidRequestResponse('仅支持 POST 方法'), origin);
		return;
	}

	const requestTokenRaw = req.headers['x-ojo-ide-token'];
	const requestToken = Array.isArray(requestTokenRaw) ? requestTokenRaw[0] : requestTokenRaw;
	if (!activeSyncToken || !requestToken || requestToken !== activeSyncToken) {
		writeSyncResponse(res, invalidTokenResponse(), origin);
		return;
	}

	let requestPayload: unknown;
	try {
		requestPayload = await readJsonBody(req);
	} catch {
		writeSyncResponse(res, invalidRequestResponse('请求体 JSON 格式错误'), origin);
		return;
	}

	const syncRequest = parseSyncRequestBody(requestPayload);
	if (!syncRequest) {
		writeSyncResponse(res, invalidRequestResponse(), origin);
		return;
	}

	if (syncInProgress) {
		writeSyncResponse(res, syncInProgressResponse(), origin);
		return;
	}

	syncInProgress = true;
	try {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		const syncCliCommand = config.get<string>('syncCliCommand', 'ojo') || 'ojo';
		const syncResult = await runWorkspaceSync({
			cliCommand: syncCliCommand,
			projectId: syncRequest.projectId,
			requestedWorkspaceHash: syncRequest.workspaceHash,
			workspaceRoot,
			confirmOverwrite: async () => {
				const overwrite = '覆盖同步';
				const selection = await vscode.window.showWarningMessage(
					'检测到 workspaceRoot/ojo-prototype 目录已有内容，是否覆盖同步？',
					{ modal: true },
					overwrite,
					'取消',
				);
				return selection === overwrite;
			},
		});
		if (syncResult.ok) {
			void vscode.window.showInformationMessage(`代码已同步到本地: ${syncResult.data.path}`);
		}
		writeSyncResponse(res, syncResult, origin);
	} catch (error) {
		console.error('[ojo-plugin] workspace sync error', error);
		writeSyncResponse(res, internalErrorResponse(), origin);
	} finally {
		syncInProgress = false;
	}
}

async function handleServerRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
	const path = getRequestPath(req);
	if (path === '/health') {
		res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
		res.end(JSON.stringify({ ok: true, service: 'ojo-plugin' }));
		return;
	}

	if (path === '/workspace/sync') {
		await handleWorkspaceSync(req, res);
		return;
	}

	res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
	res.end('ojo-plugin server is running');
}

export function deactivate() {
	if (!server) {
		return;
	}

	server.close();
	server = undefined;
}

async function buildWebLaunchUrl(): Promise<string> {
	const config = vscode.workspace.getConfiguration('ojoPlugin');
	const accountApiBaseUrl = config.get<string>('accountApiBaseUrl', 'https://aneway.ai');
	const webBaseUrl = config.get<string>('webBaseUrl', 'https://aneway.ai');
	const webTargetPath = config.get<string>('webTargetPath', '/');
	const loginBridgePath = config.get<string>('loginBridgePath', '/login/ide/handoff');
	activeSyncToken = generateSyncToken();
	const launchQuery = buildIdeLaunchQueryParams({
		client: detectIdeClient(vscode.env.appName),
		localServerOrigin: `http://127.0.0.1:${listeningPort}`,
		syncToken: activeSyncToken,
	});

	const launchResult = await resolveWebLaunchUrl(
		{
			accountApiBaseUrl,
			webBaseUrl,
			webTargetPath,
			loginBridgePath,
			queryParams: launchQuery,
		},
		authStateProvider,
		{ logger: console },
	);

	if (!launchResult.injected) {
		console.info(`[ojo-plugin] open web without ticket: ${launchResult.reason}`);
	}

	return launchResult.url;
}

async function openWebInBuiltinBrowser(): Promise<void> {
	try {
		const url = await buildWebLaunchUrl();
		// 使用 IDE 内置 Simple Browser，保持扩展常驻
		await vscode.commands.executeCommand('simpleBrowser.show', url);
	} catch (error) {
		console.warn('[ojo-plugin] failed to open built-in browser, fallback to external:', error);
		try {
			const url = await buildWebLaunchUrl();
			await vscode.env.openExternal(vscode.Uri.parse(url));
		} catch (e) {
			console.error('[ojo-plugin] open web fallback failed:', e);
		}
	}
}


async function openWebWithOptionalTicket() {
	try {
		const url = await buildWebLaunchUrl();
		const opened = await vscode.env.openExternal(vscode.Uri.parse(url));
		if (!opened) {
			vscode.window.showWarningMessage('Unable to open web page.');
		}
	} catch (error) {
		console.error('[ojo-plugin] open web error:', error);
		vscode.window.showErrorMessage(`打开 Web 失败: ${String(error)}`);
	}
}
