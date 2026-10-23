import * as assert from 'assert';
import {
	buildProjectQuickPickItems,
	buildProjectTargetPath,
	parseProjectListOutput,
	selectProjectIdFromCli,
} from '../projectLauncher';

suite('projectLauncher', () => {
	test('parseProjectListOutput parses projects from json payload', () => {
		const output =
			'listProjects /design-project/api/v1/ListProjects\n' +
			JSON.stringify({
				projects: [
					{ project_id: 'p1', name: 'Alpha', created_at: '1709990000', updated_at: 1710000000 },
					{ project_id: 'p2', updated_at: 1710001000 },
				],
				total: 2,
			});

		const projects = parseProjectListOutput(output);
		assert.deepStrictEqual(projects, [
			{ projectId: 'p1', name: 'Alpha', createdAt: 1709990000, updatedAt: 1710000000 },
			{ projectId: 'p2', createdAt: undefined, updatedAt: 1710001000 },
		]);
	});

	test('parseProjectListOutput returns empty list when projects is empty', () => {
		const output = JSON.stringify({ projects: [], total: 0 });
		const projects = parseProjectListOutput(output);
		assert.deepStrictEqual(projects, []);
	});

	test('parseProjectListOutput throws on malformed payload', () => {
		assert.throws(() => parseProjectListOutput('listProjects\n{broken'), /JSON payload|invalid/i);
	});

	test('parseProjectListOutput skips entries without valid project_id', () => {
		const output = JSON.stringify({
			projects: [{ name: 'missing-id' }, { project_id: '' }, { project_id: 'p3', name: 'Gamma' }],
			total: 3,
		});

		const projects = parseProjectListOutput(output);
		assert.deepStrictEqual(projects, [{ projectId: 'p3', name: 'Gamma', createdAt: undefined, updatedAt: undefined }]);
	});

	test('buildProjectQuickPickItems maps name and project id and includes created/updated time', () => {
		const items = buildProjectQuickPickItems([
			{ projectId: 'p1', name: 'Project One', createdAt: 1709990000, updatedAt: 1710000000 },
			{ projectId: 'p2' },
		]);

		assert.strictEqual(items.length, 3);
		assert.strictEqual(items[0].label, 'Project One');
		assert.strictEqual(items[0].description, 'p1');
		assert.match(items[0].detail ?? '', /创建时间: .* \| 更新时间: /);
		assert.strictEqual(items[1].label, 'p2');
		assert.match(items[1].detail ?? '', /创建时间: - \| 更新时间: -/);
		assert.strictEqual(items[2].manualInput, true);
		assert.strictEqual(items[2].label, '手动输入 Project ID');
	});

	test('selectProjectIdFromCli falls back to manual input when cli fails', async () => {
		let quickPickCalled = false;
		const warnings: string[] = [];

		const projectId = await selectProjectIdFromCli(
			'ojo',
			{
				showQuickPick: async () => {
					quickPickCalled = true;
					return undefined;
				},
				showInputBox: async () => '  p-manual  ',
			},
			{
				execFileImpl: async () => {
					throw new Error('network failed');
				},
				onWarning: (message) => warnings.push(message),
				logger: { warn: () => undefined },
			},
		);

		assert.strictEqual(quickPickCalled, false);
		assert.strictEqual(projectId, 'p-manual');
		assert.strictEqual(warnings.length, 1);
		assert.match(warnings[0], /手动输入 Project ID/);
	});

	test('selectProjectIdFromCli falls back to manual input when list is empty', async () => {
		let quickPickCalled = false;
		const warnings: string[] = [];

		const projectId = await selectProjectIdFromCli(
			'ojo',
			{
				showQuickPick: async () => {
					quickPickCalled = true;
					return undefined;
				},
				showInputBox: async () => 'from-empty',
			},
			{
				execFileImpl: async () => ({
					stdout: JSON.stringify({ projects: [], total: 0 }),
					stderr: '',
				}),
				onWarning: (message) => warnings.push(message),
				logger: { warn: () => undefined },
			},
		);

		assert.strictEqual(quickPickCalled, false);
		assert.strictEqual(projectId, 'from-empty');
		assert.strictEqual(warnings.length, 1);
		assert.match(warnings[0], /未获取到项目列表/);
	});

	test('buildProjectTargetPath encodes project id', () => {
		assert.strictEqual(buildProjectTargetPath('abc 123'), '/p/abc%20123');
	});
});
