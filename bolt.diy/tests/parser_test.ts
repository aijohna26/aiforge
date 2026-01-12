
function wrapNakedActions(input: string, messageId: string): string {
    const tokens = input.split(/(<afArtifact[^>]*>|<\/afArtifact>|<afAction[^>]*>|<\/afAction>)/g);
    let output = '';
    let insideArtifact = false;
    let insideHealingArtifact = false;
    let actionCounter = 0;

    for (const token of tokens) {
        if (token.startsWith('<afArtifact')) {
            insideArtifact = true;
            output += token;
        } else if (token === '</afArtifact>') {
            insideArtifact = false;
            output += token;
        } else if (token.startsWith('<afAction')) {
            if (!insideArtifact) {
                const artifactId = `artifact-${messageId}-naked-${actionCounter++}`;
                output += `<afArtifact id="${artifactId}" title="Generated Action" type="bundled">${token}`;
                insideHealingArtifact = true;
                insideArtifact = true; // logically inside now
            } else {
                output += token;
            }
        } else if (token === '</afAction>') {
            output += token;
            if (insideHealingArtifact) {
                output += '</afArtifact>';
                insideHealingArtifact = false;
                insideArtifact = false;
            }
        } else {
            output += token;
        }
    }

    return output;
}

// Test Suite
const tests = [
    {
        name: 'Complete Naked Action',
        input: '<afAction type="file">content</afAction>',
        expectedRegex: /<afArtifact.*><afAction.*>content<\/afAction><\/afArtifact>/
    },
    {
        name: 'Streaming Chunk 1 (Partial Tag)',
        input: '<afAction typ',
        expected: '<afAction typ' // Should NOT wrap yet
    },
    {
        name: 'Streaming Chunk 2 (Complete Tag)',
        input: '<afAction type="file">',
        expectedRegex: /<afArtifact.*><afAction.*>/ // Should wrap NOW
    },
    {
        name: 'Streaming Chunk 3 (Content)',
        input: '<afAction type="file">content',
        expectedRegex: /<afArtifact.*><afAction.*>content/
    }
];

console.log("Running Tests...");
let failed = 0;

tests.forEach(t => {
    const result = wrapNakedActions(t.input, 'msg-1');
    const pass = t.expectedRegex ? t.expectedRegex.test(result) : result === t.expected;

    if (!pass) {
        console.error(`[FAIL] ${t.name}`);
        console.error(`Input: ${t.input}`);
        console.error(`Expected: ${t.expected || t.expectedRegex}`);
        console.error(`Actual:   ${result}`);
        failed++;
    } else {
        console.log(`[PASS] ${t.name}`);
    }
});

if (failed === 0) console.log("All tests passed!");
else process.exit(1);
