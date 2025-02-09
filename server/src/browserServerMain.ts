import { createConnection, BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver/browser';
import { 
	InitializeParams, 
	InitializeResult, 
	TextDocuments,
	TextDocumentSyncKind
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { tokenTypes, processSemanticTokens } from './tokenProvider';

console.log('Server starting...');

// Create connection before any console.log to ensure it's ready
const connection = createConnection(
	new BrowserMessageReader(self),
	new BrowserMessageWriter(self)
);

const documents = new TextDocuments(TextDocument);

// Cache for semantic tokens with versioning
const tokenCache = new Map<string, { version: number, data: number[] }>();

// Set timeout for long operations
const TIMEOUT = 3000; // 3 seconds
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
	let timeoutHandle: NodeJS.Timeout;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutHandle = setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
	});
	try {
		const result = await Promise.race([promise, timeoutPromise]);
		clearTimeout(timeoutHandle!);
		return result;
	} catch (error) {
		clearTimeout(timeoutHandle!);
		throw error;
	}
};

connection.onInitialize((_params: InitializeParams): InitializeResult => {
	console.log('Server initializing...');
	console.log('Registering token types:', tokenTypes);
	return {
		capabilities: {
			textDocumentSync: {
				openClose: true,
				change: TextDocumentSyncKind.Full
			},
			semanticTokensProvider: {
				full: true,
				legend: {
					tokenTypes: [
						'keyword',      // 0: keywords
						'method',       // 1: functions (using method as it's a standard type)
						'string',       // 2: strings
						'property',     // 3: properties
						'variable',     // 4: values (using variable as it's more standard)
						'class'         // 5: names (using class as it typically gets the styling we want)
					],
					tokenModifiers: []
				}
			}
		}
	};
});

// Process tokens in background
const processTokensAsync = async (document: TextDocument) => {
	const tokens = await withTimeout(Promise.resolve(processSemanticTokens(document)), TIMEOUT);
	console.log('Processed tokens:', tokens);
	return tokens;
};

// Clear cache when document changes
documents.onDidChangeContent(async change => {
	const uri = change.document.uri;
	if (change.document.languageId !== 'livinglang') {
		tokenCache.delete(uri);
		return;
	}
	
	try {
		const tokens = await processTokensAsync(change.document);
		tokenCache.set(uri, { version: change.document.version, data: tokens });
	} catch (error) {
		console.error('Token processing failed:', error);
		tokenCache.delete(uri);
	}
});

connection.onRequest('textDocument/semanticTokens/full', async params => {
	const uri = params.textDocument.uri;
	const document = documents.get(uri);
	
	if (!document || document.languageId !== 'livinglang') {
		console.log('Invalid document or language ID');
		return { data: [] };
	}

	const cached = tokenCache.get(uri);
	if (cached && cached.version === document.version) {
		console.log('Using cached tokens:', cached.data);
		return { data: cached.data };
	}

	try {
		const tokens = await processTokensAsync(document);
		console.log('Generated new tokens:', tokens);
		tokenCache.set(uri, { version: document.version, data: tokens });
		return { data: tokens };
	} catch (error) {
		console.error('Token processing failed:', error);
		return { data: [] };
	}
});

documents.listen(connection);
connection.listen();

console.log('Server started and listening');
