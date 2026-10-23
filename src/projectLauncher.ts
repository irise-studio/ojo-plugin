import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PROJECT_LIST_ARGS = ['project', 'list', '--json', '--page-size', '100'] as const;

interface ExecFileOutput {
	stdout: string;
	stderr: string;
}

type ExecFileLike = (file: string, args: string[]) => Promise<ExecFileOutput>;

export interface ProjectItem {
	projectId: string;
	name?: string;
	createdAt?: number;
	updatedAt?: number;
}

export interface ProjectQuickPickItem {
	label: string;
	description?: string;
	detail?: string;
	alwaysShow?: boolean;
	projectId?: string;
	manualInput?: boolean;
}

export interface ProjectPickerUi {
	showQuickPick: (items: readonly ProjectQuickPickItem[]) => Promise<ProjectQuickPickItem | undefined>;
	showInputBox: (options: {
		prompt: string;
		placeHolder?: string;
		ignoreFocusOut?: boolean;
	}) => Promise<string | undefined>;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function toTimestampNumber(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === 'string') {
		const normalized = value.trim();
		if (normalized.length === 0) {
			return undefined;
		}
		const parsed = Number(normalized);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return undefined;
}

function extractLastJsonObject(outputText: string): string | undefined {
	const lines = outputText
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	for (let index = lines.length - 1; index >= 0; index -= 1) {
		const line = lines[index];
		if (line.startsWith('{') && line.endsWith('}')) {
			return line;
		}
	}

	const start = outputText.indexOf('{');
	const end = outputText.lastIndexOf('}');
	if (start >= 0 && end > start) {
		return outputText.slice(start, end + 1).trim();
	}

	return undefined;
}

export function parseProjectListOutput(outputText: string): ProjectItem[] {
	const jsonText = extractLastJsonObject(outputText);
	if (!jsonText) {
		throw new Error('CLI output does not contain JSON payload');
	}

	let payload: unknown;
	try {
		payload = JSON.parse(jsonText);
	} catch {
		throw new Error('CLI output JSON is invalid');
	}

	const payloadRecord = toRecord(payload);
	if (!payloadRecord || !Array.isArray(payloadRecord.projects)) {
		throw new Error('CLI output projects field is missing');
	}

	const projects: ProjectItem[] = [];
	for (const candidate of payloadRecord.projects) {
		const record = toRecord(candidate);
		if (!record) {
			continue;
		}

		const projectId = toNonEmptyString(record.project_id ?? record.projectId);
		if (!projectId) {
			continue;
		}

		const name = toNonEmptyString(record.name);
		const createdAt = toTimestampNumber(record.created_at ?? record.createdAt);
		const updatedAt = toTimestampNumber(record.updated_at ?? record.updatedAt);
		projects.push({ projectId, name, createdAt, updatedAt });
	}

	return projects;
}

function formatTimestampOrDash(label: string, timestamp: number | undefined): string {
	if (timestamp === undefined) {
		return `${label}: -`;
	}
	const ms = timestamp < 1e10 ? timestamp * 1000 : timestamp;
	const date = new Date(ms);
	if (Number.isNaN(date.getTime())) {
		return `${label}: -`;
	}
	return `${label}: ${date.toLocaleString()}`;
}

function buildProjectDetail(project: ProjectItem): string | undefined {
	return [
		formatTimestampOrDash('创建时间', project.createdAt),
		formatTimestampOrDash('更新时间', project.updatedAt),
	].join(' | ');
}

export function buildProjectQuickPickItems(projects: readonly ProjectItem[]): ProjectQuickPickItem[] {
	const items: ProjectQuickPickItem[] = projects.map((project) => ({
		label: project.name ?? project.projectId,
		description: project.projectId,
		detail: buildProjectDetail(project),
		projectId: project.projectId,
	}));

	items.push({
		label: '手动输入 Project ID',
		description: '直接输入并打开目标项目',
		alwaysShow: true,
		manualInput: true,
	});

	return items;
}

async function promptManualProjectId(ui: ProjectPickerUi): Promise<string | undefined> {
	const entered = await ui.showInputBox({
		prompt: '请输入 Ojo Project ID',
		placeHolder: '例如: 4f7f14a3-3f80-48cc-a142-0af392ee0688',
		ignoreFocusOut: true,
	});
	const projectId = entered?.trim();
	return projectId && projectId.length > 0 ? projectId : undefined;
}

export async function pickProjectId(
	projects: readonly ProjectItem[],
	ui: ProjectPickerUi,
): Promise<string | undefined> {
	if (projects.length === 0) {
		return promptManualProjectId(ui);
	}

	const picked = await ui.showQuickPick(buildProjectQuickPickItems(projects));
	if (!picked) {
		return undefined;
	}
	if (picked.manualInput) {
		return promptManualProjectId(ui);
	}
	return picked.projectId;
}

export async function listUserProjectsFromCli(
	cliCommand: string,
	execFileImpl: ExecFileLike = execFileAsync,
): Promise<ProjectItem[]> {
	const command = cliCommand.trim();
	if (command.length === 0) {
		throw new Error('syncCliCommand is empty');
	}
	const result = await execFileImpl(command, [...PROJECT_LIST_ARGS]);
	return parseProjectListOutput(result.stdout);
}

export async function selectProjectIdFromCli(
	cliCommand: string,
	ui: ProjectPickerUi,
	options?: {
		execFileImpl?: ExecFileLike;
		onWarning?: (message: string) => void;
		logger?: Pick<Console, 'warn'>;
	},
): Promise<string | undefined> {
	const logger = options?.logger ?? console;
	try {
		const projects = await listUserProjectsFromCli(cliCommand, options?.execFileImpl ?? execFileAsync);
		if (projects.length === 0) {
			options?.onWarning?.('未获取到项目列表，请手动输入 Project ID。');
			return promptManualProjectId(ui);
		}
		return pickProjectId(projects, ui);
	} catch (error) {
		logger.warn('[ojo-plugin] list projects via cli failed, fallback to manual input', error);
		options?.onWarning?.('获取项目列表失败，请手动输入 Project ID。');
		return promptManualProjectId(ui);
	}
}

export function buildProjectTargetPath(projectId: string): string {
	return `/p/${encodeURIComponent(projectId.trim())}`;
}
