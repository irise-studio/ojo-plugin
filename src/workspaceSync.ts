import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const execFileAsync = promisify(execFile);
const SYNC_SUBDIR = 'ojo-prototype';

export interface SyncRequestBody {
	projectId: string;
	workspaceHash?: string;
}

interface CliSyncPayload {
	project_id?: string;
	path?: string;
	workspace_hash?: string;
}

interface ExecFileOutput {
	stdout: string;
	stderr: string;
}

type ExecFileAsyncLike = (file: string, args: string[]) => Promise<ExecFileOutput>;

interface FileSystemLike {
	readdir(dirPath: string): Promise<string[]>;
}

export interface SyncSuccessPayload {
	projectId: string;
	path: string;
	workspaceHash?: string;
	durationMs: number;
	logs?: string[];
}

export interface SyncErrorPayload {
	code:
		| 'INVALID_REQUEST'
		| 'INVALID_TOKEN'
		| 'ORIGIN_NOT_ALLOWED'
		| 'SYNC_IN_PROGRESS'
		| 'USER_CANCELLED'
		| 'NO_WORKSPACE_OPEN'
		| 'CLI_AUTH_REQUIRED'
		| 'CLI_NOT_FOUND'
		| 'CLI_PULL_FAILED'
		| 'INTERNAL_ERROR';
	message: string;
	logs?: string[];
}

export type SyncResponse =
	| {
		ok: true;
		status: 200;
		data: SyncSuccessPayload;
	  }
	| {
		ok: false;
		status: number;
		error: SyncErrorPayload;
	  };

export interface RunWorkspaceSyncOptions {
	cliCommand: string;
	projectId: string;
	requestedWorkspaceHash?: string;
	workspaceRoot: string | undefined;
	confirmOverwrite: () => Promise<boolean>;
	execFileImpl?: ExecFileAsyncLike;
	fileSystem?: FileSystemLike;
}

function makeError(
	status: number,
	code: SyncErrorPayload['code'],
	message: string,
	logs?: string[],
): SyncResponse {
	return {
		ok: false,
		status,
		error: logs && logs.length > 0 ? { code, message, logs } : { code, message },
	};
}

function isNodeError(value: unknown): value is NodeJS.ErrnoException {
	return Boolean(value) && typeof value === 'object';
}

export function parseSyncRequestBody(payload: unknown): SyncRequestBody | undefined {
	if (!payload || typeof payload !== 'object') {
		return undefined;
	}
	const projectId = (payload as { projectId?: unknown }).projectId;
	const workspaceHash = (payload as { workspaceHash?: unknown }).workspaceHash;
	if (typeof projectId !== 'string' || projectId.trim().length === 0) {
		return undefined;
	}
	if (workspaceHash !== undefined && typeof workspaceHash !== 'string') {
		return undefined;
	}
	return {
		projectId: projectId.trim(),
		workspaceHash: typeof workspaceHash === 'string' ? workspaceHash : undefined,
	};
}

export function isAllowedOrigin(originHeader: string | undefined, webBaseUrl: string): boolean {
	if (!originHeader) {
		return false;
	}
	try {
		const origin = new URL(originHeader);
		const base = new URL(webBaseUrl);
		if (!/^https?:$/i.test(origin.protocol)) {
			return false;
		}
		if (origin.protocol !== base.protocol) {
			return false;
		}
		if (origin.host === base.host) {
			return true;
		}
		return origin.hostname.endsWith(`.${base.hostname}`);
	} catch {
		return false;
	}
}

async function directoryExistsAndNonEmpty(dirPath: string, fileSystem: FileSystemLike): Promise<boolean> {
	try {
		const entries = await fileSystem.readdir(dirPath);
		return entries.length > 0;
	} catch (error) {
		if (isNodeError(error) && error.code === 'ENOENT') {
			return false;
		}
		throw error;
	}
}

function extractLastJsonObject(stdout: string): CliSyncPayload | undefined {
	const lines = stdout
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	for (let index = lines.length - 1; index >= 0; index -= 1) {
		const line = lines[index];
		if (!line.startsWith('{') || !line.endsWith('}')) {
			continue;
		}
		try {
			const parsed: unknown = JSON.parse(line);
			if (!parsed || typeof parsed !== 'object') {
				continue;
			}
			return parsed as CliSyncPayload;
		} catch {
			// keep scanning
		}
	}
	return undefined;
}

function summarizeText(text: string, maxLength = 600): string {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}
	return `${normalized.slice(0, maxLength)}...(truncated)`;
}

function formatCliFailureMessage(error: unknown): string {
	const stdout = isNodeError(error) && 'stdout' in error && typeof error.stdout === 'string' ? error.stdout.trim() : '';
	const stderr = isNodeError(error) && 'stderr' in error && typeof error.stderr === 'string' ? error.stderr.trim() : '';
	const exitCode = isNodeError(error) && 'code' in error ? error.code : undefined;
	const signal = isNodeError(error) && 'signal' in error ? error.signal : undefined;
	const fallbackMessage = error instanceof Error ? error.message : String(error);

	const parts: string[] = [];
	if (typeof exitCode === 'number') {
		parts.push(`exit_code=${exitCode}`);
	}
	if (typeof signal === 'string' && signal.length > 0) {
		parts.push(`signal=${signal}`);
	}
	if (stderr.length > 0) {
		parts.push(`stderr=${summarizeText(stderr)}`);
	}
	if (stdout.length > 0) {
		parts.push(`stdout=${summarizeText(stdout)}`);
	}
	if (parts.length === 0) {
		parts.push(summarizeText(fallbackMessage || '同步失败，请稍后重试'));
	}
	return parts.join(' | ');
}

function pushLog(logs: string[], message: string): void {
	logs.push(`[workspace-sync] ${message}`);
}

function mapCliFailure(error: unknown, projectId: string, logs: string[]): SyncResponse {
	if (isNodeError(error) && error.code === 'ENOENT') {
		pushLog(logs, 'cli command not found');
		return makeError(500, 'CLI_NOT_FOUND', '未找到 ojo 命令，请先安装 CLI', logs);
	}

	const stderr = isNodeError(error) && 'stderr' in error && typeof error.stderr === 'string' ? error.stderr : '';
	const stdout = isNodeError(error) && 'stdout' in error && typeof error.stdout === 'string' ? error.stdout : '';
	const combined = `${stderr}\n${stdout}\n${error instanceof Error ? error.message : String(error)}`;
	pushLog(logs, `cli failure summary: ${formatCliFailureMessage(error)}`);
	if (/login|登录|auth|unauthor|session|401|未登录/i.test(combined)) {
		return makeError(401, 'CLI_AUTH_REQUIRED', 'CLI 未登录，请先执行 ojo 登录', logs);
	}
	if (/status code 403|forbidden|permission|denied|权限|无权限/i.test(combined)) {
		return makeError(
			403,
			'CLI_PULL_FAILED',
			`项目拉取被拒绝(403)，请确认当前账号对项目 ${projectId} 有访问权限，或重新登录 ojo。详情: ${formatCliFailureMessage(error)}`,
			logs,
		);
	}
	return makeError(500, 'CLI_PULL_FAILED', formatCliFailureMessage(error), logs);
}

export async function runWorkspaceSync(options: RunWorkspaceSyncOptions): Promise<SyncResponse> {
	const workspaceRoot = options.workspaceRoot;
	const fileSystem = options.fileSystem ?? fs;
	const execFileImpl = options.execFileImpl ?? execFileAsync;
	const logs: string[] = [];
	if (!workspaceRoot) {
		pushLog(logs, 'workspace root is empty');
		return makeError(422, 'NO_WORKSPACE_OPEN', '请先打开本地工作区', logs);
	}

	const outputPath = path.join(workspaceRoot, SYNC_SUBDIR);
	pushLog(logs, `start pull: projectId=${options.projectId} workspaceRoot=${workspaceRoot}`);
	const shouldPrompt = await directoryExistsAndNonEmpty(outputPath, fileSystem);
	if (shouldPrompt) {
		pushLog(logs, `target dir not empty: ${outputPath}`);
		const confirmed = await options.confirmOverwrite();
		if (!confirmed) {
			pushLog(logs, 'user cancelled overwrite');
			return makeError(409, 'USER_CANCELLED', '用户取消同步', logs);
		}
		pushLog(logs, 'user confirmed overwrite');
	}

	const startTime = Date.now();
	try {
		const cliArgs = [
			'workspace',
			'pull',
			options.projectId,
			'--path',
			workspaceRoot,
			'--json',
		];
		pushLog(logs, `exec: ${options.cliCommand} ${cliArgs.join(' ')}`);
		const { stdout, stderr } = await execFileImpl(options.cliCommand, cliArgs);
		if (stderr.trim().length > 0) {
			pushLog(logs, `stderr: ${summarizeText(stderr)}`);
		}
		if (stdout.trim().length > 0) {
			pushLog(logs, `stdout: ${summarizeText(stdout)}`);
		}
		const payload = extractLastJsonObject(stdout);
		const durationMs = Date.now() - startTime;
		pushLog(logs, `pull success in ${durationMs}ms`);
		return {
			ok: true,
			status: 200,
			data: {
				projectId: typeof payload?.project_id === 'string' ? payload.project_id : options.projectId,
				path: typeof payload?.path === 'string' ? payload.path : outputPath,
				workspaceHash:
					typeof payload?.workspace_hash === 'string' ? payload.workspace_hash : options.requestedWorkspaceHash,
				durationMs,
				logs,
			},
		};
	} catch (error) {
		return mapCliFailure(error, options.projectId, logs);
	}
}

export function getSyncSubdirName(): string {
	return SYNC_SUBDIR;
}

export function invalidRequestResponse(message = '请求参数不合法'): SyncResponse {
	return makeError(400, 'INVALID_REQUEST', message);
}

export function invalidTokenResponse(): SyncResponse {
	return makeError(401, 'INVALID_TOKEN', 'token 无效');
}

export function originNotAllowedResponse(): SyncResponse {
	return makeError(403, 'ORIGIN_NOT_ALLOWED', '请求来源不被允许');
}

export function syncInProgressResponse(): SyncResponse {
	return makeError(409, 'SYNC_IN_PROGRESS', '同步进行中，请稍后重试');
}

export function internalErrorResponse(): SyncResponse {
	return makeError(500, 'INTERNAL_ERROR', '服务内部错误');
}
