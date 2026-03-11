import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface AuthState {
	session_id: string;
	user_id: string;
	created_at_ms: number;
	expires_at_ms: number;
	source: string;
}

type FileStat = {
	mtimeMs: number;
};

export interface FileSystemLike {
	stat(filePath: string): Promise<FileStat>;
	readFile(filePath: string, encoding: 'utf8'): Promise<string>;
}

type Clock = () => number;

const DEFAULT_AUTH_FILE_PATH = path.join(os.homedir(), '.ojo/session.json');

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function toNonEmptyString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return undefined;
	}
	return value;
}

function parseAuthState(value: unknown): AuthState | undefined {
	if (!isObjectRecord(value)) {
		return undefined;
	}

	const sessionId = toNonEmptyString(value.session_id);
	const userId = toNonEmptyString(value.user_id);
	const createdAtMs = toFiniteNumber(value.created_at_ms);
	const expiresAtMs = toFiniteNumber(value.expires_at_ms);
	const source = toNonEmptyString(value.source);

	if (!sessionId || !userId || createdAtMs === undefined || expiresAtMs === undefined || !source) {
		return undefined;
	}

	return {
		session_id: sessionId,
		user_id: userId,
		created_at_ms: createdAtMs,
		expires_at_ms: expiresAtMs,
		source,
	};
}

type CacheEntry = {
	mtimeMs: number;
	authState: AuthState | undefined;
};

function isFileNotFound(error: unknown): boolean {
	if (!isObjectRecord(error)) {
		return false;
	}
	return error.code === 'ENOENT';
}

export class AuthStateProvider {
	private cache?: CacheEntry;
	private readonly filePath: string;
	private readonly fileSystem: FileSystemLike;
	private readonly now: Clock;

	constructor(options?: {
		filePath?: string;
		fileSystem?: FileSystemLike;
		now?: Clock;
	}) {
		this.filePath = options?.filePath ?? DEFAULT_AUTH_FILE_PATH;
		this.fileSystem = options?.fileSystem ?? fs;
		this.now = options?.now ?? (() => Date.now());
	}

	public async getValidAuthState(): Promise<AuthState | undefined> {
		let stat: FileStat;
		try {
			stat = await this.fileSystem.stat(this.filePath);
		} catch (error) {
			if (isFileNotFound(error)) {
				this.cache = undefined;
				return undefined;
			}
			return undefined;
		}

		if (this.cache && this.cache.mtimeMs === stat.mtimeMs) {
			return this.cache.authState;
		}

		let content: string;
		try {
			content = await this.fileSystem.readFile(this.filePath, 'utf8');
		} catch {
			this.cache = { mtimeMs: stat.mtimeMs, authState: undefined };
			return undefined;
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(content);
		} catch {
			this.cache = { mtimeMs: stat.mtimeMs, authState: undefined };
			return undefined;
		}

		const authState = parseAuthState(parsed);
		if (!authState) {
			this.cache = { mtimeMs: stat.mtimeMs, authState: undefined };
			return undefined;
		}

		if (authState.expires_at_ms <= this.now()) {
			this.cache = { mtimeMs: stat.mtimeMs, authState: undefined };
			return undefined;
		}

		this.cache = { mtimeMs: stat.mtimeMs, authState };
		return authState;
	}
}

export function getDefaultAuthFilePath(): string {
	return DEFAULT_AUTH_FILE_PATH;
}
