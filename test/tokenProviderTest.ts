import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { tokenTypes, processSemanticTokens } from '../server/src/tokenProvider';

describe('LivingLang Token Provider', () => {
    // Helper to create a test document and get tokens
    function getTokensForText(text: string) {
        const document = TextDocument.create('test.living', 'livinglang', 1, text);
        const tokens = processSemanticTokens(document);
        
        // Convert raw tokens to a more readable format
        const result: Array<{type: string; text: string}> = [];
        let line = 0;
        let character = 0;
        
        for (let i = 0; i < tokens.length; i += 5) {
            // Get token info
            const deltaLine = tokens[i];
            const deltaCharacter = tokens[i + 1];
            const length = tokens[i + 2];
            const type = tokenTypes[tokens[i + 3]];

            // Calculate absolute position
            if (deltaLine > 0) {
                line += deltaLine;
                character = deltaCharacter;
            } else {
                character += deltaCharacter;
            }

            // Get token text
            const startOffset = document.offsetAt({ line, character });
            const endOffset = startOffset + length;
            const text = document.getText({
                start: document.positionAt(startOffset),
                end: document.positionAt(endOffset)
            }).trim();
            
            // Only add non-empty tokens
            if (text) {
                result.push({ type, text });
            }
        }
        
        return result;
    }

    describe('Keywords', () => {
        it('should identify basic keywords', () => {
            const tokens = getTokensForText('experience Test {}');
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'experience' },
                { type: 'name', text: 'Test' }
            ]);
        });

        it('should identify multiple keywords', () => {
            const tokens = getTokensForText(`
                space Room {
                    zones {
                        behavior {}
                    }
                }
            `);
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'space' },
                { type: 'name', text: 'Room' },
                { type: 'keyword', text: 'zones' },
                { type: 'keyword', text: 'behavior' }
            ]);
        });

        it('should identify dialogue and monologue keywords', () => {
            const tokens = getTokensForText(`
                dialogue {
                    Hamlet: "Who's there?"
                }
                monologue {
                    Hamlet: "To be, or not to be..."
                    Ghost: "Boo!"
                }
            `);
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'dialogue' },
                { type: 'property', text: 'Hamlet' },
                { type: 'string', text: '"Who\'s there?"' },
                { type: 'keyword', text: 'monologue' },
                { type: 'property', text: 'Hamlet' },
                { type: 'string', text: '"To be, or not to be..."' },
                { type: 'property', text: 'Ghost' },
                { type: 'string', text: '"Boo!"' }
            ]);
        });

        it('should identify names after specific keywords', () => {
            const tokens = getTokensForText(`
                actor Hamlet {
                    name: "Prince of Denmark"
                }
                scene Elsinore {
                    description: "Castle in Denmark"
                }
                space ThroneRoom {
                    atmosphere {
                        lighting: dark
                    }
                }
            `);
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'actor' },
                { type: 'name', text: 'Hamlet' },
                { type: 'property', text: 'name' },
                { type: 'string', text: '"Prince of Denmark"' },
                { type: 'keyword', text: 'scene' },
                { type: 'name', text: 'Elsinore' },
                { type: 'property', text: 'description' },
                { type: 'string', text: '"Castle in Denmark"' },
                { type: 'keyword', text: 'space' },
                { type: 'name', text: 'ThroneRoom' },
                { type: 'property', text: 'atmosphere' },
                { type: 'property', text: 'lighting' },
                { type: 'value', text: 'dark' }
            ]);
        });
    });

    describe('Properties and Values', () => {
        it('should identify simple property-value pairs', () => {
            const tokens = getTokensForText('lighting: bright');
            assert.deepStrictEqual(tokens, [
                { type: 'property', text: 'lighting' },
                { type: 'value', text: 'bright' }
            ]);
        });

        it('should identify string values', () => {
            const tokens = getTokensForText('name: "Test Room"');
            assert.deepStrictEqual(tokens, [
                { type: 'property', text: 'name' },
                { type: 'string', text: '"Test Room"' }
            ]);
        });

        it('should handle escaped quotes in strings', () => {
            const tokens = getTokensForText('description: \'Former King of Denmark, Hamlet\\\'s father\'');
            assert.deepStrictEqual(tokens, [
                { type: 'property', text: 'description' },
                { type: 'string', text: '\'Former King of Denmark, Hamlet\\\'s father\'' }
            ]);
        });

        it('should handle multiline strings', () => {
            const tokens = getTokensForText(`
                monologue {
                    Hamlet: """
                        To be, or not to be, that is the question:
                        Whether 'tis nobler in the mind to suffer
                        The slings and arrows of outrageous fortune,
                        Or to take Arms against a Sea of troubles...
                    """
                }
            `);
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'monologue' },
                { type: 'property', text: 'Hamlet' },
                { type: 'string', text: '"""\n                        To be, or not to be, that is the question:\n                        Whether \'tis nobler in the mind to suffer\n                        The slings and arrows of outrageous fortune,\n                        Or to take Arms against a Sea of troubles...\n                    """' }
            ]);
        });

        it('should identify array values', () => {
            const tokens = getTokensForText('colors: [red, green, blue]');
            assert.deepStrictEqual(tokens, [
                { type: 'property', text: 'colors' },
                { type: 'value', text: 'red' },
                { type: 'value', text: 'green' },
                { type: 'value', text: 'blue' }
            ]);
        });
    });

    describe('Complex Structures', () => {
        it('should handle nested blocks', () => {
            const tokens = getTokensForText(`
                space Room {
                    atmosphere {
                        lighting: ambient
                    }
                }
            `);
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'space' },
                { type: 'name', text: 'Room' },
                { type: 'property', text: 'atmosphere' },
                { type: 'property', text: 'lighting' },
                { type: 'value', text: 'ambient' }
            ]);
        });

        it('should handle atmosphere as a regular property', () => {
            const tokens = getTokensForText(`
                space Room {
                    atmosphere {
                        lighting: bright
                        sound: quiet
                    }
                    atmosphere {
                        lighting: dark
                        sound: loud
                    }
                }
            `);
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'space' },
                { type: 'name', text: 'Room' },
                { type: 'property', text: 'atmosphere' },
                { type: 'property', text: 'lighting' },
                { type: 'value', text: 'bright' },
                { type: 'property', text: 'sound' },
                { type: 'value', text: 'quiet' },
                { type: 'property', text: 'atmosphere' },
                { type: 'property', text: 'lighting' },
                { type: 'value', text: 'dark' },
                { type: 'property', text: 'sound' },
                { type: 'value', text: 'loud' }
            ]);
        });

        it('should handle mixed content', () => {
            const tokens = getTokensForText(`
                actor Guide {
                    name: 'Tour Guide'
                    archetypes: [helper, mentor]
                    behavior {
                        style: friendly
                    }
                }
            `);
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'actor' },
                { type: 'name', text: 'Guide' },
                { type: 'property', text: 'name' },
                { type: 'string', text: "'Tour Guide'" },
                { type: 'property', text: 'archetypes' },
                { type: 'value', text: 'helper' },
                { type: 'value', text: 'mentor' },
                { type: 'keyword', text: 'behavior' },
                { type: 'property', text: 'style' },
                { type: 'value', text: 'friendly' }
            ]);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty blocks', () => {
            const tokens = getTokensForText('scene Empty {}');
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'scene' },
                { type: 'name', text: 'Empty' }
            ]);
        });

        it('should handle whitespace and comments', () => {
            const tokens = getTokensForText(`
                // This is a comment
                space Room {
                    
                    lighting: bright   // End of line comment
                }
            `);
            assert.deepStrictEqual(tokens, [
                { type: 'keyword', text: 'space' },
                { type: 'name', text: 'Room' },
                { type: 'property', text: 'lighting' },
                { type: 'value', text: 'bright' }
            ]);
        });
    });
}); 