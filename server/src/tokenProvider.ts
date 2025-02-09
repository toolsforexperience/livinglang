import { TextDocument } from 'vscode-languageserver-textdocument';

export const tokenTypes = ['keyword', 'variable', 'function', 'string', 'property', 'value'];

// Create a Map with the correct indices matching the array indices
export const tokenTypesLegend = new Map(tokenTypes.map((type, index) => [type, index]));

// Token types enum for better type safety
enum TokenType {
    Keyword = 0,
    Variable = 1,
    Function = 2,
    String = 3,
    Property = 4,
    Value = 5
}

// Keywords and their types
const KEYWORDS = new Map([
    ['experience', TokenType.Keyword],
    ['space', TokenType.Keyword],
    ['sequence', TokenType.Keyword],
    ['scene', TokenType.Keyword],
    ['actor', TokenType.Keyword],
    ['zones', TokenType.Keyword],
    ['actions', TokenType.Keyword],
    ['behavior', TokenType.Keyword],
    ['objects', TokenType.Keyword]
]);

const VARIABLES = new Map([
    ['lighting', TokenType.Variable],
    ['sound', TokenType.Variable],
    ['duration', TokenType.Variable]
]);

interface Token {
    line: number;
    character: number;
    length: number;
    type: TokenType;
    text: string;
}

class LivingLangParser {
    private tokens: Token[] = [];
    private text: string;
    private pos: number = 0;
    private line: number = 0;
    private character: number = 0;
    private inPropertyValue: boolean = false;
    private blockLevel: number = 0;
    private lastKeyword: string | null = null;
    private inAtmosphere: boolean = false;

    constructor(document: TextDocument) {
        this.text = document.getText();
    }

    private isWhitespace(char: string): boolean {
        return /\s/.test(char);
    }

    private isWordChar(char: string): boolean {
        return /[a-zA-Z0-9_-]/.test(char);
    }

    private peek(): string {
        return this.pos < this.text.length ? this.text[this.pos] : '';
    }

    private consume(): string {
        const char = this.peek();
        if (char === '\n') {
            this.line++;
            this.character = 0;
        } else {
            this.character++;
        }
        this.pos++;
        return char;
    }

    private skipWhitespace() {
        while (this.pos < this.text.length && this.isWhitespace(this.peek())) {
            this.consume();
        }
    }

    private readWord(): string {
        let word = '';
        while (this.pos < this.text.length && this.isWordChar(this.peek())) {
            word += this.consume();
        }
        return word;
    }

    private readString(quote: string): string {
        let str = quote;
        this.consume(); // consume opening quote
        while (this.pos < this.text.length) {
            const char = this.peek();
            if (char === quote) {
                str += this.consume();
                break;
            }
            str += this.consume();
        }
        return str;
    }

    private addToken(text: string, type: TokenType, startLine: number, startChar: number) {
        this.tokens.push({
            text,
            type,
            line: startLine,
            character: startChar,
            length: text.length
        });
    }

    private skipComment() {
        // Skip until end of line
        while (this.pos < this.text.length && this.peek() !== '\n') {
            this.consume();
        }
    }

    private handleIdentifier(word: string, startLine: number, startChar: number): TokenType | null {
        const lowerWord = word.toLowerCase();
        if (KEYWORDS.has(lowerWord)) {
            this.lastKeyword = lowerWord;
            return TokenType.Keyword;
        } else if (VARIABLES.has(lowerWord) && (this.inAtmosphere || !this.inPropertyValue)) {
            return TokenType.Variable;
        }
        return null;
    }

    parse(): Token[] {
        this.tokens = [];
        this.pos = 0;
        this.line = 0;
        this.character = 0;
        this.inPropertyValue = false;
        this.blockLevel = 0;
        this.lastKeyword = null;
        this.inAtmosphere = false;

        while (this.pos < this.text.length) {
            const char = this.peek();
            const startLine = this.line;
            const startChar = this.character;

            if (this.isWhitespace(char)) {
                this.skipWhitespace();
                continue;
            }

            if (char === '/' && this.text[this.pos + 1] === '/') {
                this.skipComment();
                continue;
            }

            if (char === '"' || char === "'") {
                const str = this.readString(char);
                this.addToken(str, TokenType.String, startLine, startChar);
                continue;
            }

            if (char === '{') {
                this.blockLevel++;
                if (this.lastKeyword === 'atmosphere') {
                    this.inAtmosphere = true;
                }
                this.consume();
                continue;
            }

            if (char === '}') {
                this.blockLevel--;
                if (this.inAtmosphere) {
                    this.inAtmosphere = false;
                }
                this.consume();
                continue;
            }

            if (this.isWordChar(char)) {
                const word = this.readWord();
                const nextChar = this.peek();

                if (nextChar === ':') {
                    this.consume(); // consume the colon
                    const type = this.handleIdentifier(word, startLine, startChar);
                    this.addToken(word, type || TokenType.Property, startLine, startChar);
                    this.skipWhitespace();
                    this.inPropertyValue = true;
                    
                    // Handle the value after the colon
                    const valueStartLine = this.line;
                    const valueStartChar = this.character;
                    
                    if (this.peek() === '[') {
                        this.consume(); // consume [
                        this.skipWhitespace();
                        while (this.pos < this.text.length) {
                            if (this.isWordChar(this.peek())) {
                                const arrayValue = this.readWord();
                                this.addToken(arrayValue, TokenType.Value, this.line, this.character - arrayValue.length);
                            } else if (this.peek() === ']') {
                                this.consume();
                                break;
                            } else if (this.peek() === ',') {
                                this.consume();
                                this.skipWhitespace();
                            } else {
                                this.consume();
                            }
                        }
                    } else if (this.peek() === '"' || this.peek() === "'") {
                        const str = this.readString(this.peek());
                        this.addToken(str, TokenType.String, valueStartLine, valueStartChar);
                    } else if (this.isWordChar(this.peek())) {
                        const value = this.readWord();
                        this.addToken(value, TokenType.Value, valueStartLine, valueStartChar);
                    }
                    this.inPropertyValue = false;
                } else {
                    // Check if it's a keyword or variable
                    const type = this.handleIdentifier(word, startLine, startChar);
                    if (type !== null) {
                        this.addToken(word, type, startLine, startChar);
                    } else {
                        // Skip identifiers after keywords (like "Test" in "experience Test")
                        const lastToken = this.tokens[this.tokens.length - 1];
                        if (!lastToken || lastToken.type !== TokenType.Keyword) {
                            this.addToken(word, TokenType.Property, startLine, startChar);
                        }
                    }
                }
                continue;
            }

            // Skip other characters
            this.consume();
        }

        return this.tokens;
    }
}

export function processSemanticTokens(document: TextDocument): number[] {
    const parser = new LivingLangParser(document);
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