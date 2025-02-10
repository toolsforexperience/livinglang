import { TextDocument } from 'vscode-languageserver-textdocument';
import { tokenTypesLegend, TokenTypes, TokenType } from '../../shared/src/tokenTypes';

// Language keywords and variables
const KEYWORDS = new Set([
    'experience', 'space', 'sequence', 'scene', 'actor',
    'zones', 'actions', 'behavior', 'objects', 'dialogue', 'monologue'
]);

// Keywords that should be followed by a name
const NAME_KEYWORDS = new Set([
    'actor', 'space', 'scene', 'experience', 'sequence'
]);

// Parser states
type ParserState = 'default' | 'property' | 'value' | 'string' | 'array' | 'comment';

const ParserState = {
    Default: 'default' as ParserState,
    Property: 'property' as ParserState,
    Value: 'value' as ParserState,
    String: 'string' as ParserState,
    Array: 'array' as ParserState,
    Comment: 'comment' as ParserState
};

interface Token {
    text: string;
    type: number;
    line: number;
    character: number;
    length: number;
}

class Parser {
    private text: string;
    private tokens: Token[] = [];
    private pos = 0;
    private line = 0;
    private col = 0;
    private state = ParserState.Default;
    private currentToken = '';
    private blockLevel = 0;

    constructor(document: TextDocument) {
        this.text = document.getText();
    }

    private get currentChar(): string {
        return this.pos < this.text.length ? this.text[this.pos] : '';
    }

    private get nextChar(): string {
        return this.pos + 1 < this.text.length ? this.text[this.pos + 1] : '';
    }

    private advance(): void {
        if (this.currentChar === '\n') {
            this.line++;
            this.col = 0;
        } else {
            this.col++;
        }
        this.pos++;
    }

    private addToken(text: string, type: TokenType, line: number, col: number): void {
        const typeIndex = tokenTypesLegend.get(type);
        if (typeIndex === undefined) {
            console.error('Unknown token type:', type);
            return;
        }

        // Keep the token as a single unit with its full length
        this.tokens.push({
            text,
            type: typeIndex,
            line,
            character: col,
            length: text.length
        });
    }

    parse(): Token[] {
        this.state = ParserState.Default;
        
        while (this.pos < this.text.length) {
            const state = this.state;
            switch (state) {
                case ParserState.Default:
                    this.parseDefault();
                    break;
                    
                case ParserState.Property:
                    this.parseProperty();
                    break;
                    
                case ParserState.Value:
                    this.parseValue();
                    break;
                    
                case ParserState.String:
                    this.parseString();
                    break;
                    
                case ParserState.Array:
                    this.parseArray();
                    break;
                    
                case ParserState.Comment:
                    this.parseComment();
                    break;
            }
        }
        
        return this.tokens;
    }

    private parseDefault(): void {
        // Skip whitespace
        if (/\s/.test(this.currentChar)) {
            this.advance();
            return;
        }

        // Handle comments
        if (this.currentChar === '/' && this.nextChar === '/') {
            this.state = ParserState.Comment;
            return;
        }

        // Handle strings (including multiline)
        if (this.currentChar === '"' || this.currentChar === "'") {
            // Check for triple quotes
            if (this.currentChar === '"' && 
                this.nextChar === '"' && 
                this.pos + 2 < this.text.length && 
                this.text[this.pos + 2] === '"') {
                this.state = ParserState.String;
                return;
            }
            this.state = ParserState.String;
            return;
        }

        // Handle block delimiters
        if (this.currentChar === '{') {
            this.blockLevel++;
            this.advance();
            return;
        }
        if (this.currentChar === '}') {
            this.blockLevel--;
            this.advance();
            return;
        }

        // Start reading word
        if (/[a-zA-Z0-9_-]/.test(this.currentChar)) {
            const startCol = this.col;
            const startLine = this.line;
            this.currentToken = '';
            
            while (this.pos < this.text.length && /[a-zA-Z0-9_-]/.test(this.currentChar)) {
                this.currentToken += this.currentChar;
                this.advance();
            }

            // Check if it's a property (followed by colon)
            if (this.currentChar === ':') {
                this.state = ParserState.Property;
                this.addToken(this.currentToken, TokenTypes.Property, startLine, startCol);
                this.advance(); // skip colon
                return;
            }

            // Check if it's a keyword or property
            const word = this.currentToken.toLowerCase();
            if (KEYWORDS.has(word)) {
                this.addToken(this.currentToken, TokenTypes.Keyword, startLine, startCol);
            } else {
                // Check if this is a name following a name keyword
                const lastToken = this.tokens[this.tokens.length - 1];
                if (lastToken && lastToken.type === tokenTypesLegend.get(TokenTypes.Keyword) && 
                    NAME_KEYWORDS.has(lastToken.text.toLowerCase())) {
                    this.addToken(this.currentToken, TokenTypes.Name, startLine, startCol);
                } else if (!lastToken || lastToken.type !== tokenTypesLegend.get(TokenTypes.Keyword) || this.blockLevel > 0) {
                    this.addToken(this.currentToken, TokenTypes.Property, startLine, startCol);
                }
            }
            return;
        }

        this.advance();
    }

    private parseProperty(): void {
        // Skip whitespace after property
        if (/\s/.test(this.currentChar)) {
            this.advance();
            return;
        }

        // Start value parsing
        this.state = ParserState.Value;
    }

    private parseValue(): void {
        if (/\s/.test(this.currentChar)) {
            this.advance();
            return;
        }

        const startCol = this.col;
        const startLine = this.line;

        // Handle array values
        if (this.currentChar === '[') {
            this.state = ParserState.Array;
            this.advance();
            return;
        }

        // Handle string values
        if (this.currentChar === '"' || this.currentChar === "'") {
            this.state = ParserState.String;
            return;
        }

        // Handle simple values
        if (/[a-zA-Z0-9_-]/.test(this.currentChar)) {
            let value = '';
            while (this.pos < this.text.length && /[a-zA-Z0-9_-]/.test(this.currentChar)) {
                value += this.currentChar;
                this.advance();
            }
            this.addToken(value, TokenTypes.Value, startLine, startCol);
            this.state = ParserState.Default;
            return;
        }

        this.state = ParserState.Default;
    }

    private parseString(): void {
        const startCol = this.col;
        const startLine = this.line;
        let string = '';
        
        // Check for triple quotes
        const isTripleQuote = 
            this.currentChar === '"' && 
            this.nextChar === '"' && 
            this.pos + 2 < this.text.length && 
            this.text[this.pos + 2] === '"';
            
        if (isTripleQuote) {
            // Record the starting position of the entire string, including quotes
            const stringStartPos = this.pos;
            
            // Advance past opening quotes
            this.advance(); // first quote
            this.advance(); // second quote
            this.advance(); // third quote
            
            // Find closing quotes
            let foundClosingQuotes = false;
            
            while (this.pos < this.text.length) {
                if (this.currentChar === '"' && 
                    this.nextChar === '"' && 
                    this.pos + 2 < this.text.length && 
                    this.text[this.pos + 2] === '"') {
                    // Advance to end of closing quotes
                    this.advance(); // first quote
                    this.advance(); // second quote
                    this.advance(); // third quote
                    foundClosingQuotes = true;
                    break;
                }
                this.advance();
            }
            
            // Extract the exact string from source, including all whitespace and quotes
            const stringEndPos = foundClosingQuotes ? this.pos : this.text.length;
            string = this.text.substring(stringStartPos, stringEndPos);
            
        } else {
            // Regular string handling
            const quote = this.currentChar;
            string = quote;
            
            this.advance(); // Skip opening quote
            
            while (this.pos < this.text.length) {
                // Handle escaped quotes
                if (this.currentChar === '\\' && this.nextChar === quote) {
                    string += this.currentChar; // Add the backslash
                    this.advance();
                    string += this.currentChar; // Add the escaped quote
                    this.advance();
                    continue;
                }
                
                if (this.currentChar === quote) {
                    string += quote;
                    this.advance();
                    break;
                }
                
                string += this.currentChar;
                this.advance();
            }
        }
        
        this.addToken(string, TokenTypes.String, startLine, startCol);
        this.state = ParserState.Default;
    }

    private parseArray(): void {
        if (/\s/.test(this.currentChar)) {
            this.advance();
            return;
        }

        // End of array
        if (this.currentChar === ']') {
            this.advance();
            this.state = ParserState.Default;
            return;
        }

        // Skip commas
        if (this.currentChar === ',') {
            this.advance();
            return;
        }

        // Parse array value
        if (/[a-zA-Z0-9_-]/.test(this.currentChar)) {
            const startCol = this.col;
            const startLine = this.line;
            let value = '';
            
            while (this.pos < this.text.length && /[a-zA-Z0-9_-]/.test(this.currentChar)) {
                value += this.currentChar;
                this.advance();
            }
            
            this.addToken(value, TokenTypes.Value, startLine, startCol);
            return;
        }

        this.advance();
    }

    private parseComment(): void {
        while (this.pos < this.text.length && this.currentChar !== '\n') {
            this.advance();
        }
        this.state = ParserState.Default;
    }
}

export function processSemanticTokens(document: TextDocument): number[] {
    const parser = new Parser(document);
    const tokens = parser.parse();
    
    // Convert to semantic token format
    const result: number[] = [];
    let prevLine = 0;
    let prevChar = 0;

    for (const token of tokens) {
        const deltaLine = token.line - prevLine;
        const deltaChar = deltaLine === 0 ? token.character - prevChar : token.character;

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

    return result;
} 