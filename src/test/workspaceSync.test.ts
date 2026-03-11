import * as assert from 'assert';
import {
	isAllowedOrigin,
	parseSyncRequestBody,
	runWorkspaceSync,
} from '../workspaceSync';

suite('workspaceSync', () => {
	test('parseSyncRequestBody validates shape', () => {
		assert.strictEqual(parseSyncRequestBody(undefined), undefined);
		assert.strictEqual(parseSyncRequestBody({}), undefined);
		assert.strictEqual(parseSyncRequestBody({ projectId: '' }), undefined);
		assert.strictEqual(parseSyncRequestBody({ projectId: 'p1', workspaceHash: 1 }), undefined);
		assert.deepStrictEqual(parseSyncRequestBody({ projectId: ' p1 ', workspaceHash: 'wh1' }), {
			projectId: 'p1',
			workspaceHash: 'wh1',
		});
	});

	test('isAllowedOrigin validates origin against web base url', () => {
		assert.strictEqual(isAllowedOrigin('https://aneway.ai', 'https://aneway.ai'), true);
		assert.strictEqual(isAllowedOrigin('https://foo.aneway.ai', 'https://aneway.ai'), true);
		assert.strictEqual(isAllowedOrigin('https://evil.com', 'https://aneway.ai'), false);
		assert.strictEqual(isAllowedOrigin('http://aneway.ai', 'https://aneway.ai'), false);
		assert.strictEqual(isAllowedOrigin(undefined, 'https://aneway.ai'), false);
	});

	test('runWorkspaceSync returns NO_WORKSPACE_OPEN when workspace missing', async () => {
		const result = await runWorkspaceSync({
			cliCommand: 'ojo',
			projectId: 'p1',
			workspaceRoot: undefined,
			confirmOverwrite: async () => true,
		});
		assert.strictEqual(result.ok, false);
		if (!result.ok) {
			assert.strictEqual(result.status, 422);
			assert.strictEqual(result.error.code, 'NO_WORKSPACE_OPEN');
		}
	});

	test('runWorkspaceSync prompts and handles cancel', async () => {
		const result = await runWorkspaceSync({
			cliCommand: 'ojo',
			projectId: 'p1',
			workspaceRoot: '/tmp/workspace',
			confirmOverwrite: async () => false,
			fileSystem: {
				readdir: async () => ['file.txt'],
			},
		});
		assert.strictEqual(result.ok, false);
		if (!result.ok) {
			assert.strictEqual(result.status, 409);
			assert.strictEqual(result.error.code, 'USER_CANCELLED');
		}
	});

	test('runWorkspaceSync executes cli and returns parsed payload', async () => {
		const result = await runWorkspaceSync({
			cliCommand: 'ojo',
			projectId: 'p1',
			requestedWorkspaceHash: 'from-request',
			workspaceRoot: '/tmp/workspace',
			confirmOverwrite: async () => true,
			fileSystem: {
				readdir: async () => [],
			},
			execFileImpl: async () => ({
				stdout: JSON.stringify({
					project_id: 'p1',
					path: '/tmp/workspace/ojo-prototype',
					workspace_hash: 'wh1',
				}),
				stderr: '',
			}),
		});
		assert.strictEqual(result.ok, true);
		if (result.ok) {
			assert.strictEqual(result.data.projectId, 'p1');
			assert.strictEqual(result.data.path, '/tmp/workspace/ojo-prototype');
			assert.strictEqual(result.data.workspaceHash, 'wh1');
			assert.ok(result.data.durationMs >= 0);
		}
	});

	test('runWorkspaceSync maps cli not found error', async () => {
		const result = await runWorkspaceSync({
			cliCommand: 'ojo',
			projectId: 'p1',
			workspaceRoot: '/tmp/workspace',
			confirmOverwrite: async () => true,
			fileSystem: {
				readdir: async () => [],
			},
			execFileImpl: async () => {
				const error = new Error('not found') as NodeJS.ErrnoException;
				error.code = 'ENOENT';
				throw error;
			},
		});
		assert.strictEqual(result.ok, false);
		if (!result.ok) {
			assert.strictEqual(result.error.code, 'CLI_NOT_FOUND');
		}
	});

	test('runWorkspaceSync maps auth required error', async () => {
		const result = await runWorkspaceSync({
			cliCommand: 'ojo',
			projectId: 'p1',
			workspaceRoot: '/tmp/workspace',
			confirmOverwrite: async () => true,
			fileSystem: {
				readdir: async () => [],
			},
			execFileImpl: async () => {
				const error = new Error('auth') as Error & { stderr: string };
				error.stderr = '请先登录 ojo';
				throw error;
			},
		});
		assert.strictEqual(result.ok, false);
		if (!result.ok) {
			assert.strictEqual(result.status, 401);
			assert.strictEqual(result.error.code, 'CLI_AUTH_REQUIRED');
		}
	});
});
