import * as assert from 'assert';
import type { AuthState } from '../authStateProvider';
import { resolveWebLaunchUrl, type HandoffConfig } from '../webHandoff';

const config: HandoffConfig = {
	accountApiBaseUrl: 'https://api.example.com',
	webBaseUrl: 'https://web.example.com',
	webTargetPath: '/workspace',
	loginBridgePath: '/login/ide/handoff',
};

const configWithIdeQuery: HandoffConfig = {
	...config,
	queryParams: {
		ide_in_app: '1',
		ide_client: 'vscode',
		ide_local_server: 'http://127.0.0.1:37123',
		ide_sync_token: 'sync-token',
	},
};

function createAuthState(): AuthState {
	return {
		session_id: 'session-123',
		user_id: 'user-123',
		created_at_ms: 100,
		expires_at_ms: 1000,
		source: 'cli',
	};
}

suite('resolveWebLaunchUrl', () => {
	test('returns target url when there is no auth state', async () => {
		let fetchCalled = false;
		const result = await resolveWebLaunchUrl(
			config,
			{ getValidAuthState: async () => undefined },
			{
				fetchImpl: async () => {
					fetchCalled = true;
					return new Response();
				},
			},
		);

		assert.strictEqual(fetchCalled, false);
		assert.strictEqual(result.injected, false);
		assert.strictEqual(result.reason, 'no_auth_state');
		assert.strictEqual(result.url, 'https://web.example.com/workspace');
	});

	test('injects ticket when create handoff succeeds', async () => {
		let capturedUrl = '';
		let capturedBody = '';
		const result = await resolveWebLaunchUrl(
			config,
			{ getValidAuthState: async () => createAuthState() },
			{
				fetchImpl: async (input, init) => {
					capturedUrl = String(input);
					capturedBody = String(init?.body ?? '');
					return new Response(
						JSON.stringify({
							code: 0,
							data: { ticket: 'ticket-abc' },
						}),
						{ status: 200, headers: { 'Content-Type': 'application/json' } },
					);
				},
			},
		);

		assert.strictEqual(capturedUrl, 'https://api.example.com/api/auth/v1/create_ide_handoff');
		assert.match(capturedBody, /"client":"cli"/);
		assert.match(capturedBody, /"target_url":"https:\/\/web.example.com\/workspace"/);
		assert.strictEqual(result.injected, true);
		assert.strictEqual(result.reason, 'ticket_injected');
		assert.strictEqual(result.url, 'https://web.example.com/login/ide/handoff?ticket=ticket-abc');
	});

	test('injects ide query params for both fallback and bridge urls', async () => {
		const noAuthResult = await resolveWebLaunchUrl(
			configWithIdeQuery,
			{ getValidAuthState: async () => undefined },
			{
				fetchImpl: async () => {
					throw new Error('fetch should not be called');
				},
			},
		);
		assert.strictEqual(
			noAuthResult.url,
			'https://web.example.com/workspace?ide_in_app=1&ide_client=vscode&ide_local_server=http%3A%2F%2F127.0.0.1%3A37123&ide_sync_token=sync-token',
		);

		const ticketResult = await resolveWebLaunchUrl(
			configWithIdeQuery,
			{ getValidAuthState: async () => createAuthState() },
			{
				fetchImpl: async () =>
					new Response(JSON.stringify({ code: 0, data: { ticket: 'ticket-123' } }), {
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					}),
			},
		);
		assert.strictEqual(
			ticketResult.url,
			'https://web.example.com/login/ide/handoff?ticket=ticket-123&ide_in_app=1&ide_client=vscode&ide_local_server=http%3A%2F%2F127.0.0.1%3A37123&ide_sync_token=sync-token',
		);
	});

	test('falls back when account returns business error', async () => {
		const result = await resolveWebLaunchUrl(
			config,
			{ getValidAuthState: async () => createAuthState() },
			{
				fetchImpl: async () => new Response(JSON.stringify({ code: 1001, errmsg: 'invalid' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}),
				logger: { info: () => undefined, warn: () => undefined },
			},
		);

		assert.strictEqual(result.injected, false);
		assert.strictEqual(result.reason, 'handoff_failed');
		assert.strictEqual(result.url, 'https://web.example.com/workspace');
	});

	test('falls back when account returns non-200', async () => {
		const result = await resolveWebLaunchUrl(
			config,
			{ getValidAuthState: async () => createAuthState() },
			{
				fetchImpl: async () => new Response('internal error', { status: 500 }),
				logger: { info: () => undefined, warn: () => undefined },
			},
		);

		assert.strictEqual(result.injected, false);
		assert.strictEqual(result.reason, 'handoff_failed');
	});
});
