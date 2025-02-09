import { TextDocument } from 'vscode-languageserver-textdocument';

export const tokenTypes = ['keyword', 'variable', 'function', 'string', 'property', 'value'];

// Create a Map with the correct indices matching the array indices
export const tokenTypesLegend = new Map(tokenTypes.map((type, index) => [type, index]));

// Pre-compile the regex patterns
const WORD_PATTERN = /\b(?:experience|space|sequence|scene|lighting|sound|duration|actor|objects|participant_group|monologue|dialogue|zones|actions|behavior)\b/g;
const STRING_PATTERN = /"[^"]*"|'[^']*'/g;
const ATTRIBUTE_PATTERN = /(\w+):\s*(?:\[([^\]]+)\]|([^,\s\n{}\[\]]+))/g;
const BLOCK_PROPERTY_PATTERN = /\b(atmosphere)\s*{/g;

// Pre-map words to their token types and indices using a more efficient structure
const TOKEN_MAP: { [key: string]: [number, number] } = {
    // [tokenType, length]
    'experience': [0, 10],
    'space': [0, 5],
    'sequence': [0, 8],
    'scene': [0, 5],
    'actor': [0, 5],
    'zones': [0, 5],
    'actions': [0, 7],
    'behavior': [0, 8],
    'lighting': [1, 8],
    'sound': [1, 5],
    'duration': [1, 8],
    'objects': [0, 7],
    'participant_group': [0, 17],
    'monologue': [0, 9],
    'dialogue': [0, 8]
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

    // Collect block property tokens
    BLOCK_PROPERTY_PATTERN.lastIndex = 0;
    let blockMatch;
    while ((blockMatch = BLOCK_PROPERTY_PATTERN.exec(text)) !== null) {
        const property = blockMatch[1];
        const pos = document.positionAt(blockMatch.index);
        tokens.push({
            line: pos.line,
            character: pos.character,
            length: property.length,
            type: 4 // property type
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

    // Collect attribute and value tokens
    ATTRIBUTE_PATTERN.lastIndex = 0;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = ATTRIBUTE_PATTERN.exec(text)) !== null) {
        const [fullMatch, attribute, arrayValues, singleValue] = attrMatch;
        const attrPos = document.positionAt(attrMatch.index);

        // Add attribute token
        tokens.push({
            line: attrPos.line,
            character: attrPos.character,
            length: attribute.length,
            type: 4 // property type
        });

        // Handle array values
        if (arrayValues) {
            const values = arrayValues.split(',').map(v => v.trim()).filter(Boolean);
            values.forEach(value => {
                const valueStart = text.indexOf(value, attrMatch!.index);
                if (valueStart !== -1) {
                    const valuePos = document.positionAt(valueStart);
                    tokens.push({
                        line: valuePos.line,
                        character: valuePos.character,
                        length: value.length,
                        type: 5 // value type
                    });
                }
            });
        }
        // Handle single value
        else if (singleValue && !singleValue.startsWith('"') && !singleValue.startsWith("'")) {
            const valuePos = document.positionAt(attrMatch.index + attribute.length + 1); // +1 for the colon
            tokens.push({
                line: valuePos.line,
                character: valuePos.character + 1, // +1 for the space after colon
                length: singleValue.length,
                type: 5 // value type
            });
        }
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