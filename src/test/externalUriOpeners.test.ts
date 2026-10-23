import * as assert from 'assert';
import { mergeExternalUriOpeners, normalizeUriGlobs } from '../externalUriOpeners';

suite('externalUriOpeners', () => {
	test('normalizeUriGlobs returns trimmed non-empty strings', () => {
		const result = normalizeUriGlobs([' https://a/** ', '', '   ', 123, null]);
		assert.deepStrictEqual(result, ['https://a/**']);
	});

	test('mergeExternalUriOpeners only adds missing globs', () => {
		const existing = {
			'https://aneway.ai/**': 'simpleBrowser.open',
			'https://foo.bar/**': 'some.other.opener',
		};
		const merged = mergeExternalUriOpeners(existing, [
			'https://aneway.ai/**',
			'https://*.aneway.ai/**',
			'http://ojo.art/**',
		]);
		assert.strictEqual(merged.changed, true);
		assert.deepStrictEqual(merged.value, {
			'https://aneway.ai/**': 'simpleBrowser.open',
			'https://foo.bar/**': 'some.other.opener',
			'https://*.aneway.ai/**': 'simpleBrowser.open',
			'http://ojo.art/**': 'simpleBrowser.open',
		});
	});

	test('mergeExternalUriOpeners keeps unchanged data', () => {
		const existing = {
			'https://aneway.ai/**': 'custom.opener',
		};
		const merged = mergeExternalUriOpeners(existing, ['https://aneway.ai/**']);
		assert.strictEqual(merged.changed, false);
		assert.deepStrictEqual(merged.value, existing);
	});
});
