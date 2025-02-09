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

    it('should identify all token types correctly', () => {
        const tokens = processSemanticTokens(testDocument);
        console.log('Generated tokens:', tokens);
        
        // Helper to get token text and info
        const getTokenInfo = (index: number) => {
            const start = testDocument.positionAt(index);
            const end = testDocument.positionAt(index + tokens[index + 2]);
            return {
                text: testDocument.getText({
                    start,
                    end
                }),
                line: tokens[index],
                character: tokens[index + 1],
                length: tokens[index + 2],
                type: tokens[index + 3],
                modifier: tokens[index + 4]
            };
        };
        
        // Helper to find tokens of a specific type with their text
        const findTokensOfType = (typeIndex: number) => {
            console.log(`Looking for token type index ${typeIndex}`);
            const matches = new Set<string>();
            let prevLine = 0;
            let prevChar = 0;
            
            for (let i = 0; i < tokens.length; i += 5) {
                if (tokens[i + 3] === typeIndex) {
                    // Calculate absolute position
                    const line = prevLine + tokens[i];
                    const char = tokens[i] === 0 ? prevChar + tokens[i + 1] : tokens[i + 1];
                    const pos = testDocument.offsetAt({ line, character: char });
                    const length = tokens[i + 2];
                    
                    const text = testDocument.getText({
                        start: testDocument.positionAt(pos),
                        end: testDocument.positionAt(pos + length)
                    });
                    matches.add(text);
                }
                
                // Update previous position
                if (tokens[i] === 0) {
                    prevChar += tokens[i + 1];
                } else {
                    prevLine += tokens[i];
                    prevChar = tokens[i + 1];
                }
            }
            
            const uniqueMatches = Array.from(matches);
            console.log(`Found tokens for type ${tokenTypes[typeIndex]}:`, uniqueMatches);
            return uniqueMatches;
        };

        // Test for all token types
        const keywordTokens = findTokensOfType(tokenTypes.indexOf('keyword'));
        const functionTokens = findTokensOfType(tokenTypes.indexOf('function'));
        const variableTokens = findTokensOfType(tokenTypes.indexOf('variable'));
        const stringTokens = findTokensOfType(tokenTypes.indexOf('string'));
        const propertyTokens = findTokensOfType(tokenTypes.indexOf('property'));
        const valueTokens = findTokensOfType(tokenTypes.indexOf('value'));

        // Keywords
        assert.deepStrictEqual(
            keywordTokens.sort(),
            ['experience', 'space', 'actor', 'scene', 'sequence', 'zones', 'actions', 'behavior'].sort(),
            'Should find correct keyword tokens'
        );

        // Functions
        assert.deepStrictEqual(
            functionTokens,
            [],
            'Should not find any function tokens'
        );

        // Variables
        assert.deepStrictEqual(
            variableTokens.sort(),
            ['lighting', 'sound', 'duration'].sort(),
            'Should find correct variable tokens'
        );

        // Strings
        assert.deepStrictEqual(
            stringTokens.sort(),
            ['\'Test Guide\'', '\'A test character\''].sort(),
            'Should find correct string tokens'
        );

        // Properties
        const expectedProperties = [
            'atmosphere',
            'lighting',
            'sound',
            'temperature',
            'activity',
            'name',
            'description',
            'archetypes',
            'style',
            'presence',
            'duration'
        ];
        
        assert.deepStrictEqual(
            propertyTokens.sort(),
            expectedProperties.sort(),
            `Should find correct properties. Found: ${propertyTokens.join(', ')}`
        );

        // Values
        const expectedValues = [
            'ambient_soft',
            'nature_sounds',
            'warm',
            'bright',
            'greeting',
            'guide',
            'mentor',
            'helper',
            'welcoming',
            'gentle',
            'welcome_music',
            '5.minutes',
            '10.minutes'
        ];
        
        assert.deepStrictEqual(
            valueTokens.sort(),
            expectedValues.sort(),
            `Should find correct values. Found: ${valueTokens.join(', ')}`
        );
    });

    it('should handle property-value pairs correctly', () => {
        const tokens = processSemanticTokens(testDocument);
        
        // Helper to get token info and text
        const getTokenInfo = (index: number) => {
            let line = 0;
            let char = 0;
            
            // Calculate absolute position
            for (let i = 0; i <= index; i += 5) {
                if (i === index) {
                    line += tokens[i];
                    char = tokens[i] === 0 ? char + tokens[i + 1] : tokens[i + 1];
                } else {
                    if (tokens[i] === 0) {
                        char += tokens[i + 1];
                    } else {
                        line += tokens[i];
                        char = tokens[i + 1];
                    }
                }
            }
            
            const pos = testDocument.positionAt(testDocument.offsetAt({ line, character: char }));
            const text = testDocument.getText({
                start: pos,
                end: testDocument.positionAt(testDocument.offsetAt(pos) + tokens[index + 2])
            });
            
            return {
                text,
                deltaLine: tokens[index],
                deltaChar: tokens[index + 1],
                length: tokens[index + 2],
                type: tokens[index + 3],
                modifier: tokens[index + 4]
            };
        };

        // Find all property tokens
        const propertyIndices = tokens
            .map((_, i) => i)
            .filter(i => i % 5 === 3 && tokens[i] === tokenTypes.indexOf('property'));

        // For each property token
        propertyIndices.forEach(propertyIndex => {
            const propertyToken = getTokenInfo(propertyIndex - 3);
            const nextTokenIndex = propertyIndex + 2;
            
            // Skip validation for block properties (like 'atmosphere')
            if (nextTokenIndex < tokens.length && !propertyToken.text.includes('atmosphere')) {
                const nextToken = getTokenInfo(nextTokenIndex);
                assert.ok(
                    nextToken.type === tokenTypes.indexOf('value') || 
                    nextToken.type === tokenTypes.indexOf('string'),
                    'Property should be followed by either a value or string token'
                );
            }
        });
    });
}); 