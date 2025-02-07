import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { tokenTypes, processSemanticTokens } from '../server/src/tokenProvider';

describe('Living Language Semantic Token Provider', () => {
    let testDocument: TextDocument;

    before(() => {
        const fixturePath = path.join(__dirname, 'fixtures/test.living');
        const content = fs.readFileSync(fixturePath, 'utf8');
        console.log('Test file content:', content);
        testDocument = TextDocument.create('file:///test.living', 'livinglang', 1, content);
    });

    it('should identify keywords correctly', () => {
        const tokens = processSemanticTokens(testDocument);
        console.log('Generated tokens:', tokens);
        
        // Helper to find tokens of a specific type
        const findTokensOfType = (typeIndex: number) => {
            console.log(`Looking for token type index ${typeIndex}`);
            const matches: number[] = [];
            
            for (let i = 0; i < tokens.length; i += 5) {
                console.log(`Token at ${i}:`, {
                    deltaLine: tokens[i],
                    deltaChar: tokens[i + 1],
                    length: tokens[i + 2],
                    tokenType: tokens[i + 3],
                    modifiers: tokens[i + 4]
                });
                if (tokens[i + 3] === typeIndex) {
                    matches.push(i);
                }
            }
            
            console.log(`Found ${matches.length} matches for type index ${typeIndex}`);
            return matches;
        };

        const keywordTokens = findTokensOfType(tokenTypes.indexOf('keyword'));
        const functionTokens = findTokensOfType(tokenTypes.indexOf('function'));
        const variableTokens = findTokensOfType(tokenTypes.indexOf('variable'));

        // We expect 3 keywords: experience, space, sequence
        assert.strictEqual(keywordTokens.length, 3, 'Should find 3 keyword tokens');

        // We expect 4 function-like tokens: on, trigger, scene, atmosphere
        assert.strictEqual(functionTokens.length, 4, 'Should find 4 function tokens');

        // We expect 5 variable tokens: lighting (2x), sound (2x), duration
        assert.strictEqual(variableTokens.length, 5, 'Should find 5 variable tokens (lighting and sound appear twice, plus duration)');
    });
}); 