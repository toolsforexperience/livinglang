export const TokenTypes = {
    Keyword: 'keyword',
    Function: 'function',
    String: 'string',
    Property: 'property',
    Value: 'value',
    Name: 'name'
} as const;

export type TokenType = typeof TokenTypes[keyof typeof TokenTypes];

export const tokenTypes: TokenType[] = [
    TokenTypes.Keyword,   // 0
    TokenTypes.Function,  // 1
    TokenTypes.String,    // 2
    TokenTypes.Property,  // 3
    TokenTypes.Value,     // 4
    TokenTypes.Name       // 5
];

export const tokenTypesLegend = new Map(tokenTypes.map((type, index) => [type, index]));

export enum TokenTypeIndex {
    Keyword = 0,
    Function = 1,
    String = 2,
    Property = 3,
    Value = 4,
    Name = 5
} 