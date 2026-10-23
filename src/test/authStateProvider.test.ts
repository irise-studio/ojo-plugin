import * as assert from 'assert';
import { AuthStateProvider, type FileSystemLike } from '../authStateProvider';

function createNotFoundError(): NodeJS.ErrnoException {
	const error = new Error('not found') as NodeJS.ErrnoException;
	error.code = 'ENOENT';
	return error;
}

suite('AuthStateProvider', () => {
	test('returns undefined when auth file does not exist', async () => {
		const fileSystem: FileSystemLike = {
			stat: async () => {
				throw createNotFoundError();
			},
			readFile: async () => '{"session_id":"never"}',
		};
		const provider = new AuthStateProvider({ filePath: '/tmp/missing.json', fileSystem, now: () => 0 });

		const authState = await provider.getValidAuthState();
		assert.strictEqual(authState, undefined);
	});

	test('returns undefined when file has invalid json', async () => {
		const fileSystem: FileSystemLike = {
			stat: async () => ({ mtimeMs: 10 }),
			readFile: async () => '{broken',
		};
		const provider = new AuthStateProvider({ filePath: '/tmp/invalid.json', fileSystem, now: () => 0 });

		const authState = await provider.getValidAuthState();
		assert.strictEqual(authState, undefined);
	});

	test('returns undefined when required fields are missing', async () => {
		const fileSystem: FileSystemLike = {
			stat: async () => ({ mtimeMs: 10 }),
			readFile: async () => JSON.stringify({ session_id: 'abc' }),
		};
		const provider = new AuthStateProvider({ filePath: '/tmp/missing-fields.json', fileSystem, now: () => 0 });

		const authState = await provider.getValidAuthState();
		assert.strictEqual(authState, undefined);
	});

	test('returns undefined when session is expired', async () => {
		const fileSystem: FileSystemLike = {
			stat: async () => ({ mtimeMs: 10 }),
			readFile: async () => JSON.stringify({
				session_id: 'sid',
				user_id: 'uid',
				created_at_ms: 100,
				expires_at_ms: 200,
				source: 'cli',
			}),
		};
		const provider = new AuthStateProvider({ filePath: '/tmp/expired.json', fileSystem, now: () => 200 });

		const authState = await provider.getValidAuthState();
		assert.strictEqual(authState, undefined);
	});

	test('returns valid auth state', async () => {
		const fileSystem: FileSystemLike = {
			stat: async () => ({ mtimeMs: 10 }),
			readFile: async () => JSON.stringify({
				session_id: 'sid',
				user_id: 'uid',
				created_at_ms: 100,
				expires_at_ms: 300,
				source: 'cli',
			}),
		};
		const provider = new AuthStateProvider({ filePath: '/tmp/valid.json', fileSystem, now: () => 200 });

		const authState = await provider.getValidAuthState();
		assert.deepStrictEqual(authState, {
			session_id: 'sid',
			user_id: 'uid',
			created_at_ms: 100,
			expires_at_ms: 300,
			source: 'cli',
		});
	});

	test('uses mtime cache to avoid re-reading unchanged file', async () => {
		let readCount = 0;
		const fileSystem: FileSystemLike = {
			stat: async () => ({ mtimeMs: 10 }),
			readFile: async () => {
				readCount += 1;
				return JSON.stringify({
					session_id: 'sid',
					user_id: 'uid',
					created_at_ms: 100,
					expires_at_ms: 300,
					source: 'cli',
				});
			},
		};
		const provider = new AuthStateProvider({ filePath: '/tmp/cache.json', fileSystem, now: () => 200 });

		const first = await provider.getValidAuthState();
		const second = await provider.getValidAuthState();
		assert.strictEqual(readCount, 1);
		assert.deepStrictEqual(first, second);
	});

	test('re-reads file when mtime changes', async () => {
		let statCount = 0;
		let readCount = 0;
		const fileSystem: FileSystemLike = {
			stat: async () => {
				statCount += 1;
				return { mtimeMs: statCount === 1 ? 10 : 11 };
			},
			readFile: async () => {
				readCount += 1;
				return JSON.stringify({
					session_id: readCount === 1 ? 'sid-1' : 'sid-2',
					user_id: 'uid',
					created_at_ms: 100,
					expires_at_ms: 500,
					source: 'cli',
				});
			},
		};
		const provider = new AuthStateProvider({ filePath: '/tmp/cache-refresh.json', fileSystem, now: () => 200 });

		const first = await provider.getValidAuthState();
		const second = await provider.getValidAuthState();
		assert.strictEqual(readCount, 2);
		assert.notStrictEqual(first?.session_id, second?.session_id);
	});
});
