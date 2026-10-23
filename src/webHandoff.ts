import type { AuthState } from './authStateProvider';

export interface AuthStateReader {
	getValidAuthState(): Promise<AuthState | undefined>;
}

export interface HandoffConfig {
	accountApiBaseUrl: string;
	webBaseUrl: string;
	webTargetPath: string;
	loginBridgePath: string;
	queryParams?: Record<string, string>;
}

type Logger = Pick<Console, 'info' | 'warn'>;

interface CreateHandoffResponse {
	code?: number;
	errmsg?: string;
	data?: {
		ticket?: string;
	};
}

export interface WebLaunchResult {
	url: string;
	injected: boolean;
	reason: 'ticket_injected' | 'no_auth_state' | 'handoff_failed';
}

function appendQueryParams(url: URL, queryParams: Record<string, string> | undefined): URL {
	if (!queryParams) {
		return url;
	}
	for (const [key, value] of Object.entries(queryParams)) {
		url.searchParams.set(key, value);
	}
	return url;
}

function buildTargetUrl(config: HandoffConfig): URL {
	return appendQueryParams(new URL(config.webTargetPath, config.webBaseUrl), config.queryParams);
}

function normalizeBaseUrl(baseUrl: string): string {
	const url = new URL(baseUrl);
	url.pathname = '';
	url.search = '';
	url.hash = '';
	return url.toString();
}

function buildCreateHandoffEndpoint(config: HandoffConfig): string {
	const base = normalizeBaseUrl(config.accountApiBaseUrl);
	return new URL('/api/auth/v1/create_ide_handoff', base).toString();
}

function parseCreateHandoffResponse(bodyText: string): CreateHandoffResponse | undefined {
	try {
		const payload: unknown = JSON.parse(bodyText);
		if (!payload || typeof payload !== 'object') {
			return undefined;
		}
		return payload as CreateHandoffResponse;
	} catch {
		return undefined;
	}
}

function summarizeForLog(text: string, maxLength = 800): string {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}
	return `${normalized.slice(0, maxLength)}...(truncated)`;
}

function buildBridgeUrl(config: HandoffConfig, ticket: string): string {
	const bridgeUrl = new URL(config.loginBridgePath, config.webBaseUrl);
	bridgeUrl.searchParams.set('ticket', ticket);
	appendQueryParams(bridgeUrl, config.queryParams);
	return bridgeUrl.toString();
}

export async function resolveWebLaunchUrl(
	config: HandoffConfig,
	authStateReader: AuthStateReader,
	options?: {
		fetchImpl?: typeof fetch;
		logger?: Logger;
	},
): Promise<WebLaunchResult> {
	const fetchImpl = options?.fetchImpl ?? fetch;
	const logger = options?.logger ?? console;
	const targetUrl = buildTargetUrl(config);
	const fallback = (): WebLaunchResult => ({ url: targetUrl.toString(), injected: false, reason: 'handoff_failed' });

	const authState = await authStateReader.getValidAuthState();
	if (!authState) {
		return {
			url: targetUrl.toString(),
			injected: false,
			reason: 'no_auth_state',
		};
	}
	const endpoint = buildCreateHandoffEndpoint(config);

	try {
		const response = await fetchImpl(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Ojo-Session-Id': authState.session_id,
				Authorization: `Bearer ${authState.session_id}`,
			},
			body: JSON.stringify({
				target_url: targetUrl.toString(),
				client: 'cli',
			}),
		});
		const responseText = await response.text();
		const responseSummary = responseText ? summarizeForLog(responseText) : '<empty>';
		const payload = parseCreateHandoffResponse(responseText);

		if (!response.ok) {
			logger.warn(
				`[ojo-plugin] create handoff failed: status=${response.status} statusText=${response.statusText || 'unknown'} endpoint=${endpoint} body=${responseSummary}`,
			);
			return fallback();
		}

		const ticket = payload?.data?.ticket;
		if (payload?.code !== 0 || !ticket) {
			logger.warn(
				`[ojo-plugin] create handoff rejected: code=${String(payload?.code ?? 'unknown')} errmsg=${String(payload?.errmsg ?? 'unknown')} endpoint=${endpoint} body=${responseSummary}`,
			);
			return fallback();
		}

		return {
			url: buildBridgeUrl(config, ticket),
			injected: true,
			reason: 'ticket_injected',
		};
	} catch (error) {
		logger.warn(`[ojo-plugin] create handoff request error: endpoint=${endpoint} error=${String(error)}`);
		return fallback();
	}
}
