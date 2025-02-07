import { TextDocument } from 'vscode-languageserver-textdocument';

export const tokenTypes = ['keyword', 'variable', 'function', 'string'];

// Create a Map with the correct indices matching the array indices
export const tokenTypesLegend = new Map(tokenTypes.map((type, index) => [type, index]));

// Pre-compile the regex patterns
const WORD_PATTERN = /\b(?:experience|space|sequence|on|trigger|scene|atmosphere|lighting|sound|duration)\b/g;
const STRING_PATTERN = /"[^"]*"|'[^']*'/g;

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

interface Token {
    line: number;
    character: number;
    length: number;
    type: number;
}

export function processSemanticTokens(document: TextDocument): number[] {
    console.log("Processing tokens for:", document.uri);
    const text = document.getText();
    const tokens: Token[] = [];

    // Collect string tokens
    STRING_PATTERN.lastIndex = 0;
    let stringMatch;
    while ((stringMatch = STRING_PATTERN.exec(text)) !== null) {
        const stringContent = stringMatch[0];
        const pos = document.positionAt(stringMatch.index);
        tokens.push({
            line: pos.line,
            character: pos.character,
            length: stringContent.length,
            type: 3 // string type
        });
    }

    // Collect word tokens
    WORD_PATTERN.lastIndex = 0;
    let match;
    while ((match = WORD_PATTERN.exec(text)) !== null) {
        const word = match[0];
        const [type, length] = TOKEN_MAP[word];
        const pos = document.positionAt(match.index);
        
        if (length <= 0 || type < 0 || type >= tokenTypes.length) {
            console.error(`Invalid token values for "${word}":`, { length, type });
            continue;
        }

        tokens.push({
            line: pos.line,
            character: pos.character,
            length,
            type
        });
    }

    // Sort tokens by position
    tokens.sort((a, b) => {
        if (a.line !== b.line) return a.line - b.line;
        return a.character - b.character;
    });

    // Convert to semantic token format
    const result: number[] = [];
    let prevLine = 0;
    let prevChar = 0;

    for (const token of tokens) {
        const deltaLine = token.line - prevLine;
        const deltaChar = deltaLine === 0 ? token.character - prevChar : token.character;

        if (deltaLine < 0 || deltaChar < 0) {
            console.error('Invalid token position:', token);
            continue;
        }

        result.push(
            deltaLine,
            deltaChar,
            token.length,
            token.type,
            0 // no modifiers
        );

        prevLine = token.line;
        prevChar = token.character;
    }

    // Validate final token array
    if (result.length % 5 !== 0) {
        console.error('Token array length is not a multiple of 5:', result.length);
    }

    console.log(`Generated ${result.length / 5} tokens:`, result);
    return result;
} 