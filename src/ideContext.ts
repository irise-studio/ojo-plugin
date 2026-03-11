import crypto from 'node:crypto';

export interface IdeLaunchContext {
	client: 'vscode' | 'cursor';
	localServerOrigin: string;
	syncToken: string;
}

export function detectIdeClient(appName: string): 'vscode' | 'cursor' {
	return /cursor/i.test(appName) ? 'cursor' : 'vscode';
}

export function generateSyncToken(): string {
	return crypto.randomBytes(24).toString('base64url');
}

export function buildIdeLaunchQueryParams(context: IdeLaunchContext): Record<string, string> {
	return {
		ide_in_app: '1',
		ide_client: context.client,
		ide_local_server: context.localServerOrigin,
		ide_sync_token: context.syncToken,
	};
}
