/*---------------------------------------------------------------------------------------------
 * 基于 VS Code proposed API: https://github.com/microsoft/vscode/issues/109277
 *--------------------------------------------------------------------------------------------*/

declare module 'vscode' {
	export enum ExternalUriOpenerPriority {
		None = 0,
		Option = 1,
		Default = 2,
		Preferred = 3,
	}

	export interface OpenExternalUriContext {
		readonly sourceUri: Uri;
	}

	export interface ExternalUriOpener {
		canOpenExternalUri(uri: Uri, token: CancellationToken): ExternalUriOpenerPriority | Thenable<ExternalUriOpenerPriority>;
		openExternalUri(resolvedUri: Uri, ctx: OpenExternalUriContext, token: CancellationToken): Thenable<void> | void;
	}

	export interface ExternalUriOpenerMetadata {
		readonly schemes: readonly string[];
		readonly label: string;
	}

	export namespace window {
		export function registerExternalUriOpener(
			id: string,
			opener: ExternalUriOpener,
			metadata: ExternalUriOpenerMetadata,
		): Disposable;
	}
}
