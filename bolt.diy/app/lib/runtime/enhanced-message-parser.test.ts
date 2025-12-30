import { describe, it, expect } from 'vitest';
import { EnhancedStreamingMessageParser } from './enhanced-message-parser';

describe('EnhancedStreamingMessageParser', () => {
  it('should wrap raw package.json content in artifact tags', () => {
    const parser = new EnhancedStreamingMessageParser();
    const input = `
Here is the configuration:
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "start": "vite"
  },
  "dependencies": {
    "react": "^18.0.0"
  }
}
Hope that helps!
    `;

    const result = parser.parse('msg-1', input);

    // The parser replaces content with a placeholder div in strict mode, 
    // but the critical check is that the RAW JSON is gone from the output.
    expect(result).not.toContain('"name": "my-app"');
    expect(result).not.toContain('"dependencies": {');
    // And implies it was processed.
    expect(result).toContain('boltArtifact');
  });

  it('should correctly capture nested objects in package.json', () => {
    const parser = new EnhancedStreamingMessageParser();
    const input = `
{
  "name": "nested-test",
  "dependencies": {
    "react": "18.0.0",
    "expo": "50.0.0"
  },
  "devDependencies": {
    "typescript": "5.0.0"
  }
}
    `;
    const result = parser.parse('msg-nested', input);

    // If the regex is greedy/wrong, it leaves trailing braces
    expect(result).not.toContain('}');
    expect(result).not.toContain('{');
    expect(result).toContain('<div class="__boltArtifact__"');
  });

  it('should preserve standard boltArtifacts without corruption', () => {
    const parser = new EnhancedStreamingMessageParser();
    const input = `
Some intro text.
<boltArtifact id="art-1" title="Project" type="bundled">
<boltAction type="file" filePath="/src/index.js">
console.log('Hello');
</boltAction>
</boltArtifact>
More text.
    `;
    const result = parser.parse('msg-standard', input);

    expect(result).toContain('<div class="__boltArtifact__"');
    // Note: The content inside the artifact is stripped from the main output 
    // and handled via callbacks/store updates in the browser, 
    // so we just check effectively that the artifact shell exists
    expect(result).toContain('data-message-id="msg-standard"');
    // Ensure no double wrapping or extra artifacts
    const matches = result.match(/class="__boltArtifact__"/g);
    expect(matches?.length).toBe(1);
  });

  it('should detect raw package.json even if other artifacts exist', () => {
    const parser = new EnhancedStreamingMessageParser();
    const input = `
I have created the first file:
<boltArtifact id="art-1" title="index.js" type="bundled">
<boltAction type="file" filePath="/index.js">
console.log("hello");
</boltAction>
</boltArtifact>

And here is the package.json:
{ "name": "examscan", "version": "1.0.0", "scripts": { "start": "expo start" }, "dependencies": { "expo": "^54.0.0", "react": "18.3.1" } }
    `;

    const result = parser.parse('mixed-msg', input);

    // Should still have the first artifact (as placeholder)
    // We check for presence of ANY artifact ID here as they might be re-generated
    expect(result).toMatch(/data-artifact-id="[^"]+"/);


    // Should have WRAPPED the second one (as placeholder). 
    // If it failed, it would just be the raw string.
    expect(result).not.toContain('{ "name": "examscan"');
    expect(result).toContain('data-artifact-id="mixed-msg-0"'); // Auto-generated ID
  });
});
