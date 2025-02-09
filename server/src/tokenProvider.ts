import { TextDocument } from 'vscode-languageserver-textdocument';

// Token types
export const tokenTypes = ['keyword', 'variable', 'function', 'string', 'property', 'value'];
export const tokenTypesLegend = new Map(tokenTypes.map((type, index) => [type, index]));

enum TokenType {
    Keyword = 0,
    Variable = 1,
    Function = 2,
    String = 3,
    Property = 4,
    Value = 5
}

// Language keywords and variables
const KEYWORDS = new Set([
    'experience', 'space', 'sequence', 'scene', 'actor',
    'zones', 'actions', 'behavior', 'objects'
]);

const VARIABLES = new Set(['lighting', 'sound', 'duration']);

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
    type: TokenType;
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
    private inAtmosphere = false;

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
        this.tokens.push({
            text,
            type,
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

        // Handle strings
        if (this.currentChar === '"' || this.currentChar === "'") {
            this.state = ParserState.String;
            return;
        }

        // Handle atmosphere blocks
        if (this.currentChar === '{') {
            if (this.tokens[this.tokens.length - 1]?.text.toLowerCase() === 'atmosphere') {
                this.inAtmosphere = true;
            }
            this.advance();
            return;
        }

        if (this.currentChar === '}') {
            this.inAtmosphere = false;
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
                const word = this.currentToken.toLowerCase();
                if (VARIABLES.has(word)) {
                    this.addToken(this.currentToken, TokenType.Variable, startLine, startCol);
                } else {
                    this.addToken(this.currentToken, TokenType.Property, startLine, startCol);
                }
                this.advance(); // skip colon
                return;
            }

            // Check if it's a keyword or variable
            const word = this.currentToken.toLowerCase();
            if (KEYWORDS.has(word)) {
                this.addToken(this.currentToken, TokenType.Keyword, startLine, startCol);
            } else if (VARIABLES.has(word)) {
                this.addToken(this.currentToken, TokenType.Variable, startLine, startCol);
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
            this.addToken(value, TokenType.Value, startLine, startCol);
            this.state = ParserState.Default;
            return;
        }

        this.state = ParserState.Default;
    }

    private parseString(): void {
        const quote = this.currentChar;
        const startCol = this.col;
        const startLine = this.line;
        let string = quote;
        
        this.advance(); // Skip opening quote
        
        while (this.pos < this.text.length && this.currentChar !== quote) {
            string += this.currentChar;
            this.advance();
        }
        
        if (this.currentChar === quote) {
            string += quote;
            this.advance();
        }
        
        this.addToken(string, TokenType.String, startLine, startCol);
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
            
            this.addToken(value, TokenType.Value, startLine, startCol);
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