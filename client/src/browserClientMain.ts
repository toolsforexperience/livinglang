import { ExtensionContext, Uri, window, SemanticTokens, workspace, TextDocument, CancellationToken, ProviderResult } from 'vscode';
import { LanguageClientOptions } from 'vscode-languageclient';
import { LanguageClient } from 'vscode-languageclient/browser';
import * as vscode from 'vscode';
import { tokenTypes, TokenTypes } from '../../shared/src/tokenTypes';

let client: LanguageClient;
let lastRequestTime = 0;
const THROTTLE_TIME = 100; // ms
let pendingTokenRequest: { resolve: (value: SemanticTokens | null) => void, reject: (error: any) => void } | null = null;

function scheduleTokenUpdate(promise: ProviderResult<SemanticTokens>): Promise<SemanticTokens | null> {
	return new Promise((resolve, reject) => {
		// Cancel any pending request
		if (pendingTokenRequest) {
			pendingTokenRequest.resolve(null);
		}
		
		pendingTokenRequest = { resolve, reject };

		requestAnimationFrame(async () => {
			try {
				const result = promise instanceof Promise ? await promise : promise;
				pendingTokenRequest?.resolve(result || null);
			} catch (error) {
				pendingTokenRequest?.reject(error);
			} finally {
				pendingTokenRequest = null;
			}
		});
	});
}

export async function activate(context: ExtensionContext) {
	console.log("Starting activation...");

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ language: 'livinglang' }],
		synchronize: {
			configurationSection: 'livinglang'
		},
		middleware: {
			provideDocumentSemanticTokens: async (document: TextDocument, token: CancellationToken, next) => {
				// Throttle requests
				const now = Date.now();
				if (now - lastRequestTime < THROTTLE_TIME) {
					return null;
				}
				lastRequestTime = now;

				console.log('Semantic tokens requested for:', document.uri.toString());
				try {
					const result = await scheduleTokenUpdate(next(document, token));
					if (token.isCancellationRequested) {
						return null;
					}

					if (result instanceof SemanticTokens) {
						const data = result.data;
						console.log('Received semantic tokens:', {
							totalTokens: data.length / 5,
							dataLength: data.length,
							isValidLength: data.length % 5 === 0,
							firstToken: data.length >= 5 ? {
								deltaLine: data[0],
								deltaChar: data[1],
								length: data[2],
								type: data[3],
								modifiers: data[4]
							} : null
						});

						// Validate token data
						if (data.length % 5 !== 0) {
							console.error('Invalid token data length:', data.length);
							return null;
						}

						// Check for invalid values
						for (let i = 0; i < data.length; i += 5) {
							if (data[i] < 0 || data[i + 1] < 0 || data[i + 2] <= 0) {
								console.error('Invalid token values at index', i, ':', 
									data.slice(i, i + 5));
								return null;
							}
						}
					} else {
						console.log('No semantic tokens received');
					}

					return result;
				} catch (error) {
					console.error('Error in semantic tokens middleware:', error);
					return null;
				}
			}
		}
	};

	try {
		// Create and initialize worker
		console.log("Creating worker...");
		const workerURL = Uri.joinPath(context.extensionUri, 'server/dist/browserServerMain.js').toString(true);
		const worker = new Worker(workerURL, {
			name: 'LivingLang Server'
		});

		worker.onerror = (error) => {
			console.error('Worker error:', error);
			window.showErrorMessage('Language server worker error');
		};

		// Create and start client
		console.log("Creating client...");
		client = new LanguageClient(
			'livinglang',
			'Living Language',
			clientOptions,
			worker
		);

		console.log("Starting client...");
		const startTime = Date.now();
		await client.start();
		console.log(`Client started in ${Date.now() - startTime}ms`);

		// Register semantic token provider with explicit token types
		const legend = new vscode.SemanticTokensLegend(
			[
				TokenTypes.Keyword,
				TokenTypes.Function,
				TokenTypes.String,
				TokenTypes.Property,
				TokenTypes.Value,
				TokenTypes.Name
			],
			[]
		);

		console.log('Registering semantic token provider with types:', tokenTypes);
		console.log('Package.json semantic token styles should be applied from semanticTokenStyleDefaults');

		context.subscriptions.push(
			vscode.languages.registerDocumentSemanticTokensProvider(
				{ language: 'livinglang' },
				{
					provideDocumentSemanticTokens: async (document: vscode.TextDocument) => {
						console.log('Providing semantic tokens for document:', document.uri.toString());
						const tokens = await client.sendRequest<{ data: number[] }>('textDocument/semanticTokens/full', {
							textDocument: { uri: document.uri.toString() }
						});
						console.log('Received token data:', tokens.data);
						return new vscode.SemanticTokens(new Uint32Array(tokens.data));
					}
				},
				legend
			)
		);

		// Configure workspace
		workspace.getConfiguration('editor').update('semanticTokenColorCustomizations', {
			enabled: true
		}, true);

	} catch (error) {
		console.error("Initialization error:", error);
		window.showErrorMessage('Failed to start Living Language extension');
	}
}

export async function deactivate(): Promise<void> {
	if (pendingTokenRequest) {
		pendingTokenRequest.resolve(null);
		pendingTokenRequest = null;
	}

	if (client) {
		try {
			await client.stop();
		} catch (e) {
			console.error("Client stop error:", e);
		}
		client = undefined!;
	}
}
