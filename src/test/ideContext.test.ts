import * as assert from 'assert';
import { buildIdeLaunchQueryParams, detectIdeClient, generateSyncToken } from '../ideContext';

suite('ideContext', () => {
	test('detectIdeClient identifies cursor app name', () => {
		assert.strictEqual(detectIdeClient('Cursor'), 'cursor');
		assert.strictEqual(detectIdeClient('Visual Studio Code'), 'vscode');
	});

	test('generateSyncToken returns non-empty random token', () => {
		const tokenA = generateSyncToken();
		const tokenB = generateSyncToken();
		assert.ok(tokenA.length > 0);
		assert.notStrictEqual(tokenA, tokenB);
	});

	test('buildIdeLaunchQueryParams returns required fields', () => {
		assert.deepStrictEqual(
			buildIdeLaunchQueryParams({
				client: 'vscode',
				localServerOrigin: 'http://127.0.0.1:37123',
				syncToken: 'abc',
			}),
			{
				ide_in_app: '1',
				ide_client: 'vscode',
				ide_local_server: 'http://127.0.0.1:37123',
				ide_sync_token: 'abc',
			},
		);
	});
});
