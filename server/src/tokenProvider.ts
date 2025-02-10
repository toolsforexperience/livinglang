import { TextDocument } from 'vscode-languageserver-textdocument';
import { tokenTypesLegend, TokenTypes, TokenType } from '../../shared/src/tokenTypes';

// Types and Interfaces
// ===================

interface Token {
    text: string;
    type: number;
    line: number;
    character: number;
    length: number;
}

interface ParserPosition {
    pos: number;
    line: number;
    col: number;
}

type ParserState = 'default' | 'property' | 'value' | 'string' | 'array' | 'comment';

// Constants and Configuration
// =========================

const ParserState = {
    Default: 'default' as ParserState,
    Property: 'property' as ParserState,
    Value: 'value' as ParserState,
    String: 'string' as ParserState,
    Array: 'array' as ParserState,
    Comment: 'comment' as ParserState
} as const;

const KEYWORDS = new Set([
    'experience', 'space', 'sequence', 'scene', 'actor',
    'zones', 'actions', 'behavior', 'objects', 'dialogue', 'monologue'
]);

const NAME_KEYWORDS = new Set([
    'actor', 'space', 'scene', 'experience', 'sequence'
]);

// Utility Functions
// ===============

const isWhitespace = (char: string): boolean => /\s/.test(char);
const isWordChar = (char: string): boolean => /[a-zA-Z0-9_-]/.test(char);
const isQuote = (char: string): boolean => char === '"' || char === "'";

// Parser Class
// ===========

class Parser {
    private text: string;
    private tokens: Token[] = [];
    private position: ParserPosition;
    private state: ParserState;
    private currentToken: string;
    private blockLevel: number;

    constructor(document: TextDocument) {
        this.text = document.getText();
        this.position = { pos: 0, line: 0, col: 0 };
        this.state = ParserState.Default;
        this.currentToken = '';
        this.blockLevel = 0;
    }

    // Position and Character Management
    // -------------------------------

    private get currentChar(): string {
        return this.position.pos < this.text.length ? this.text[this.position.pos] : '';
    }

    private get nextChar(): string {
        return this.position.pos + 1 < this.text.length ? this.text[this.position.pos + 1] : '';
    }

    private advance(): void {
        if (this.currentChar === '\n') {
            this.position.line++;
            this.position.col = 0;
        } else {
            this.position.col++;
        }
        this.position.pos++;
    }

    // Token Management
    // ---------------

    private addToken(text: string, type: TokenType, line: number, col: number): void {
        const typeIndex = tokenTypesLegend.get(type);
        if (typeIndex === undefined) {
            console.error('Unknown token type:', type);
            return;
        }

        this.tokens.push({
            text,
            type: typeIndex,
            line,
            character: col,
            length: text.length
        });
    }

    // Main Parsing Logic
    // ----------------

    parse(): Token[] {
        while (this.position.pos < this.text.length) {
            switch (this.state) {
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

    // State-Specific Parsing
    // --------------------

    private parseDefault(): void {
        if (isWhitespace(this.currentChar)) {
            this.advance();
            return;
        }

        if (this.isCommentStart()) {
            this.state = ParserState.Comment;
            return;
        }

        if (this.isStringStart()) {
            this.state = ParserState.String;
            return;
        }

        if (this.handleBlockDelimiters()) {
            return;
        }

        if (isWordChar(this.currentChar)) {
            this.handleWord();
            return;
        }

        this.advance();
    }

    private isCommentStart(): boolean {
        return this.currentChar === '/' && this.nextChar === '/';
    }

    private isStringStart(): boolean {
        const isTripleQuote = this.currentChar === '"' && 
            this.nextChar === '"' && 
            this.position.pos + 2 < this.text.length && 
            this.text[this.position.pos + 2] === '"';
        return isQuote(this.currentChar) || isTripleQuote;
    }

    private handleBlockDelimiters(): boolean {
        if (this.currentChar === '{') {
            this.blockLevel++;
            this.advance();
            return true;
        }
        if (this.currentChar === '}') {
            this.blockLevel--;
            this.advance();
            return true;
        }
        return false;
    }

    private handleWord(): void {
        const startCol = this.position.col;
        const startLine = this.position.line;
        this.currentToken = '';
        
        while (this.position.pos < this.text.length && isWordChar(this.currentChar)) {
            this.currentToken += this.currentChar;
            this.advance();
        }

        if (this.currentChar === ':') {
            this.state = ParserState.Property;
            this.addToken(this.currentToken, TokenTypes.Property, startLine, startCol);
            this.advance();
            return;
        }

        this.categorizeWord(startLine, startCol);
    }

    private categorizeWord(startLine: number, startCol: number): void {
        const word = this.currentToken.toLowerCase();
        if (KEYWORDS.has(word)) {
            this.addToken(this.currentToken, TokenTypes.Keyword, startLine, startCol);
            return;
        }

        const lastToken = this.tokens[this.tokens.length - 1];
        if (this.isNameToken(lastToken)) {
            this.addToken(this.currentToken, TokenTypes.Name, startLine, startCol);
        } else {
            this.addToken(this.currentToken, TokenTypes.Property, startLine, startCol);
        }
    }

    private isNameToken(lastToken: Token | undefined): boolean {
        if (!lastToken) {
            return false;
        }
        return lastToken.type === tokenTypesLegend.get(TokenTypes.Keyword) && 
            NAME_KEYWORDS.has(lastToken.text.toLowerCase());
    }

    private parseProperty(): void {
        if (isWhitespace(this.currentChar)) {
            this.advance();
            return;
        }
        this.state = ParserState.Value;
    }

    private parseValue(): void {
        if (isWhitespace(this.currentChar)) {
            this.advance();
            return;
        }

        const startCol = this.position.col;
        const startLine = this.position.line;

        if (this.currentChar === '[') {
            this.state = ParserState.Array;
            this.advance();
            return;
        }

        if (isQuote(this.currentChar)) {
            this.state = ParserState.String;
            return;
        }

        if (isWordChar(this.currentChar)) {
            this.parseSimpleValue(startLine, startCol);
            return;
        }

        this.state = ParserState.Default;
    }

    private parseSimpleValue(startLine: number, startCol: number): void {
        let value = '';
        while (this.position.pos < this.text.length && isWordChar(this.currentChar)) {
            value += this.currentChar;
            this.advance();
        }
        this.addToken(value, TokenTypes.Value, startLine, startCol);
        this.state = ParserState.Default;
    }

    private parseString(): void {
        const startCol = this.position.col;
        const startLine = this.position.line;
        
        const isTripleQuote = this.currentChar === '"' && 
            this.nextChar === '"' && 
            this.position.pos + 2 < this.text.length && 
            this.text[this.position.pos + 2] === '"';
            
        if (isTripleQuote) {
            this.parseTripleQuotedString(startLine, startCol);
        } else {
            this.parseSingleQuotedString(startLine, startCol);
        }
        
        this.state = ParserState.Default;
    }

    private parseTripleQuotedString(startLine: number, startCol: number): void {
        const stringStartPos = this.position.pos;
        let currentLineStartPos = stringStartPos;
        let currentLineNumber = startLine;
        
        // Add opening quotes as first token
        const openingQuotes = this.text.substring(stringStartPos, stringStartPos + 3);
        this.addToken(openingQuotes, TokenTypes.String, startLine, startCol);
        
        // Skip opening quotes
        this.advance();
        this.advance();
        this.advance();
        
        // Update start position for content
        currentLineStartPos = this.position.pos;
        
        while (this.position.pos < this.text.length) {
            // Check for end of string
            if (this.currentChar === '"' && 
                this.nextChar === '"' && 
                this.position.pos + 2 < this.text.length && 
                this.text[this.position.pos + 2] === '"') {
                // Add the last line if there's content
                if (this.position.pos > currentLineStartPos) {
                    const lineText = this.text.substring(currentLineStartPos, this.position.pos);
                    const lineStartCol = currentLineNumber === startLine ? startCol + 3 : 0;
                    this.addToken(lineText, TokenTypes.String, currentLineNumber, lineStartCol);
                }
                
                // Add the closing quotes as a separate token
                const closingQuotePos = this.position.pos;
                const closingQuotes = this.text.substring(closingQuotePos, closingQuotePos + 3);
                this.addToken(closingQuotes, TokenTypes.String, currentLineNumber, this.position.col);
                
                // Advance past closing quotes
                this.advance();
                this.advance();
                this.advance();
                break;
            }

            // Handle line breaks in multiline strings
            if (this.currentChar === '\n') {
                // Add the current line if there's content
                if (this.position.pos > currentLineStartPos) {
                    const lineText = this.text.substring(currentLineStartPos, this.position.pos);
                    const lineStartCol = currentLineNumber === startLine ? startCol + 3 : 0;
                    this.addToken(lineText, TokenTypes.String, currentLineNumber, lineStartCol);
                }
                this.advance();
                currentLineStartPos = this.position.pos;
                currentLineNumber++;
                continue;
            }

            this.advance();
        }
    }

    private parseSingleQuotedString(startLine: number, startCol: number): void {
        const quote = this.currentChar;
        let string = quote;
        
        this.advance();
        
        while (this.position.pos < this.text.length) {
            if (this.currentChar === '\\' && this.nextChar === quote) {
                string += this.currentChar + this.nextChar;
                this.advance();
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
        
        this.addToken(string, TokenTypes.String, startLine, startCol);
    }

    private parseArray(): void {
        if (isWhitespace(this.currentChar)) {
            this.advance();
            return;
        }

        if (this.currentChar === ']') {
            this.advance();
            this.state = ParserState.Default;
            return;
        }

        if (this.currentChar === ',') {
            this.advance();
            return;
        }

        if (isWordChar(this.currentChar)) {
            this.parseArrayValue();
            return;
        }

        this.advance();
    }

    private parseArrayValue(): void {
        const startCol = this.position.col;
        const startLine = this.position.line;
        let value = '';
        
        while (this.position.pos < this.text.length && isWordChar(this.currentChar)) {
            value += this.currentChar;
            this.advance();
        }
        
        this.addToken(value, TokenTypes.Value, startLine, startCol);
    }

    private parseComment(): void {
        while (this.position.pos < this.text.length && this.currentChar !== '\n') {
            this.advance();
        }
        this.state = ParserState.Default;
    }
}

// Main Export Function
// ==================

/**
 * Processes a document and returns semantic tokens in the format expected by the LSP.
 * @param document The text document to process
 * @returns An array of numbers representing the semantic tokens
 */
export function processSemanticTokens(document: TextDocument): number[] {
    const parser = new Parser(document);
    const tokens = parser.parse();
    
    return convertTokensToLSPFormat(tokens);
}

function convertTokensToLSPFormat(tokens: Token[]): number[] {
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