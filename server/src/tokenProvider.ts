import { TextDocument } from 'vscode-languageserver-textdocument';

export const tokenTypes = ['keyword', 'variable', 'function'];

// Create a Map with the correct indices matching the array indices
export const tokenTypesLegend = new Map(tokenTypes.map((type, index) => [type, index]));

// Pre-compile the regex pattern - using a more efficient single-pass approach
const WORD_PATTERN = /\b(?:experience|space|sequence|on|trigger|scene|atmosphere|lighting|sound|duration)\b/g;

// Pre-map words to their token types and indices using a more efficient structure
const TOKEN_MAP: { [key: string]: [number, number] } = {
    // [tokenType, length]
    'experience': [0, 10],
    'space': [0, 5],
    'sequence': [0, 8],
    'on': [2, 2],
    'trigger': [2, 7],
    'scene': [2, 5],
    'atmosphere': [2, 10],
    'lighting': [1, 8],
    'sound': [1, 5],
    'duration': [1, 8]
};

export function processSemanticTokens(document: TextDocument): number[] {
    console.log("Processing tokens for:", document.uri);
    const text = document.getText();
    const tokens: number[] = [];
    let prevLine = 0;
    let prevChar = 0;

    // Reset regex lastIndex to ensure consistent behavior
    WORD_PATTERN.lastIndex = 0;

    let match;
    while ((match = WORD_PATTERN.exec(text)) !== null) {
        const word = match[0];
        const [type, length] = TOKEN_MAP[word];
        const pos = document.positionAt(match.index);
        
        // Calculate deltas
        const deltaLine = pos.line - prevLine;
        const deltaChar = deltaLine === 0 ? pos.character - prevChar : pos.character;

        // Validate token values before pushing
        if (deltaLine < 0 || deltaChar < 0 || length <= 0 || type < 0 || type >= tokenTypes.length) {
            console.error(`Invalid token values for "${word}":`, {
                deltaLine,
                deltaChar,
                length,
                type,
                pos: { line: pos.line, character: pos.character }
            });
            continue;
        }

        // Push token data
        tokens.push(deltaLine, deltaChar, length, type, 0);

        // Update previous position
        prevLine = pos.line;
        prevChar = pos.character;
    }

    // Validate final token array
    if (tokens.length % 5 !== 0) {
        console.error('Token array length is not a multiple of 5:', tokens.length);
    }

    console.log(`Generated ${tokens.length / 5} tokens:`, tokens);
    return tokens;
} 