import { StreamingMessageParser, type StreamingMessageParserOptions } from './message-parser';

/**
 * Enhanced message parser that detects code blocks and file patterns
 * even when AI models don't wrap them in proper artifact tags.
 * Fixes issue #1797 where code outputs to chat instead of files.
 */
export class EnhancedStreamingMessageParser extends StreamingMessageParser {
  private _processedCodeBlocks = new Map<string, Set<string>>();
  private _artifactCounter = 0;

  // Optimized command pattern lookup
  private _commandPatternMap = new Map<string, RegExp>([
    ['npm', /^(npm|yarn|pnpm)\s+(install|run|start|build|dev|test|init|create|add|remove)/],
    ['git', /^(git)\s+(add|commit|push|pull|clone|status|checkout|branch|merge|rebase|init|remote|fetch|log)/],
    ['docker', /^(docker|docker-compose)\s+/],
    ['build', /^(make|cmake|gradle|mvn|cargo|go)\s+/],
    ['network', /^(curl|wget|ping|ssh|scp|rsync)\s+/],
    ['webcontainer', /^(cat|chmod|cp|echo|hostname|kill|ln|ls|mkdir|mv|ps|pwd|rm|rmdir|xxd)\s*/],
    ['webcontainer-extended', /^(alias|cd|clear|env|false|getconf|head|sort|tail|touch|true|uptime|which)\s*/],
    ['interpreters', /^(node|python|python3|java|go|rust|ruby|php|perl)\s+/],
    ['text-processing', /^(grep|sed|awk|cut|tr|sort|uniq|wc|diff)\s+/],
    ['archive', /^(tar|zip|unzip|gzip|gunzip)\s+/],
    ['process', /^(ps|top|htop|kill|killall|jobs|nohup)\s*/],
    ['system', /^(df|du|free|uname|whoami|id|groups|date|uptime)\s*/],
  ]);

  constructor(options: StreamingMessageParserOptions = {}) {
    super(options);
  }

  parse(messageId: string, input: string): string {
    // CRITICAL FIX: Detect raw design handoff JSON and wrap it in artifact tags
    const wrappedInput = this._wrapDesignHandoffJSON(input);
    if (wrappedInput !== input) {
      input = wrappedInput;
    }

    // CRITICAL FIX: Detect and wrap package.json content to prevent it from appearing in chat
    const wrappedPackageJson = this._wrapPackageJSON(messageId, input);
    if (wrappedPackageJson !== input) {
      input = wrappedPackageJson;
      // Reset logic to handle retrospective wrapping
      this.reset();
    }

    // CRITICAL FIX: Detect and remove style/theme objects from appearing in chat
    const cleanedInput = this._removeStyleObjects(input);
    if (cleanedInput !== input) {
      input = cleanedInput;
    }

    // First try the normal parsing
    let output = super.parse(messageId, input);

    // Always check for code blocks that should be files, even if artifacts exist
    // This handles "mixed content" where the LLM might output some valid artifacts
    // but also raw code blocks (like CSS or TS) that need to be captured.
    const enhancedInput = this._detectAndWrapCodeBlocks(messageId, input);

    if (enhancedInput !== input) {
      // Reset and reparse with enhanced input
      this.reset();
      output = super.parse(messageId, enhancedInput);
    }

    return output;
  }

  private _hasDetectedArtifacts(input: string): boolean {
    return input.includes('<boltArtifact') || input.includes('</boltArtifact>');
  }

  private _findArtifactRanges(input: string): [number, number][] {
    const ranges: [number, number][] = [];
    const openTagRegex = /<boltArtifact/gi;
    const closeTagRegex = /<\/boltArtifact>/gi;

    let match;
    while ((match = openTagRegex.exec(input)) !== null) {
      const start = match.index;
      closeTagRegex.lastIndex = start;
      const closeMatch = closeTagRegex.exec(input);

      if (closeMatch) {
        ranges.push([start, closeMatch.index + closeMatch[0].length]);
      } else {
        ranges.push([start, input.length]);
      }
    }
    return ranges;
  }

  private _isInsideArtifact(index: number, ranges: [number, number][]): boolean {
    return ranges.some(([start, end]) => index >= start && index < end);
  }

  private _findActionRanges(input: string): [number, number][] {
    const ranges: [number, number][] = [];
    const openTagRegex = /<boltAction/gi;
    const closeTagRegex = /<\/boltAction>/gi;

    let match;
    while ((match = openTagRegex.exec(input)) !== null) {
      const start = match.index;
      closeTagRegex.lastIndex = start;
      const closeMatch = closeTagRegex.exec(input);

      if (closeMatch) {
        ranges.push([start, closeMatch.index + closeMatch[0].length]);
      } else {
        ranges.push([start, input.length]);
      }
    }
    return ranges;
  }

  private _isInsideAction(index: number, ranges: [number, number][]): boolean {
    return ranges.some(([start, end]) => index >= start && index < end);
  }

  private _detectAndWrapCodeBlocks(messageId: string, input: string): string {
    // Initialize processed blocks for this message if not exists
    if (!this._processedCodeBlocks.has(messageId)) {
      this._processedCodeBlocks.set(messageId, new Set());
    }

    const processed = this._processedCodeBlocks.get(messageId)!;

    let enhanced = input;

    // First, detect and handle shell commands separately
    enhanced = this._detectAndWrapShellCommands(messageId, enhanced, processed);

    // Optimized regex patterns with better performance
    const patterns = [
      // Pattern 1: File path followed by code block (most common, check first)
      {
        regex: /(?:^|\n)([\/\w\-\.]+\.\w+):?\s*\n+```(\w*)\n([\s\S]*?)```/gim,
        type: 'file_path',
      },

      // Pattern 2: Explicit file creation mentions
      {
        regex:
          /(?:create|update|modify|edit|write|add|generate|here'?s?|file:?)\s+(?:a\s+)?(?:new\s+)?(?:file\s+)?(?:called\s+)?[`'"]*([\/\w\-\.]+\.\w+)[`'"]*:?\s*\n+```(\w*)\n([\s\S]*?)```/gi,
        type: 'explicit_create',
      },

      // Pattern 3: Code blocks with filename comments
      {
        regex: /```(\w*)\n(?:\/\/|#|<!--)\s*(?:file:?|filename:?)\s*([\/\w\-\.]+\.\w+).*?\n([\s\S]*?)```/gi,
        type: 'comment_filename',
      },

      // Pattern 4: Code block with "in <filename>" context
      {
        regex: /(?:in|for|update)\s+[`'"]*([\/\w\-\.]+\.\w+)[`'"]*:?\s*\n+```(\w*)\n([\s\S]*?)```/gi,
        type: 'in_filename',
      },

      // Pattern 5: Structured files (package.json, components)
      {
        regex:
          /```(?:json|jsx?|tsx?|html?|vue|svelte)\n(\{[\s\S]*?"(?:name|version|scripts|dependencies|devDependencies)"[\s\S]*?\}|<\w+[^>]*>[\s\S]*?<\/\w+>[\s\S]*?)```/gi,
        type: 'structured_file',
      },

      // Pattern 6: Raw package.json (no code block)
      {
        regex: /(?:^|\n)(\{\s*"(?:name|private|version)":[\s\S]*?(?:dependencies|devDependencies|scripts)[\s\S]*?\})(?=\n\n|$)/gi,
        type: 'raw_package_json',
      },

      // Pattern 7: Raw CJS Module (module.exports =)
      {
        regex: /(?:^|\n)(module\.exports\s*=\s*[\s\S]+?)(?=\n\n(?:I|We|The|Here|Let|This|import)|$)/gi,
        type: 'raw_cjs_module',
      },

      // Pattern 8: Raw ESM Module (imports/exports)
      {
        regex: /(?:^|\n)((?:import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*|export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+)+[\s\S]+?)(?=\n\n(?:I|We|The|Here|Let|This|module\.exports)|$)/gi,
        type: 'raw_esm_module',
      },
    ];

    // Process each pattern in order of likelihood
    for (const pattern of patterns) {
      // Re-calculate ranges on each pass because the string changes
      const artifactRanges = this._findArtifactRanges(enhanced);
      const actionRanges = this._findActionRanges(enhanced);

      enhanced = enhanced.replace(pattern.regex, (match, ...args) => {
        // Check if inside existing artifact OR action
        const offset = args[args.length - 2];
        if (this._isInsideArtifact(offset, artifactRanges) || this._isInsideAction(offset, actionRanges)) {
          return match;
        }

        // Skip if already processed
        const blockHash = this._hashBlock(match);

        if (processed.has(blockHash)) {
          return match;
        }

        let filePath: string;
        let language: string;
        let content: string;

        // Extract based on pattern type
        if (pattern.type === 'comment_filename') {
          [language, filePath, content] = args;
        } else if (pattern.type === 'structured_file') {
          content = args[0];
          language = pattern.regex.source.includes('json') ? 'json' : 'jsx';
          filePath = this._inferFileNameFromContent(content, language);
        } else if (pattern.type === 'raw_package_json') {
          content = args[0];
          language = 'json';
          filePath = 'package.json';
        } else if (pattern.type === 'raw_cjs_module') {
          content = args[0];
          language = 'javascript';
          filePath = 'metro.config.js'; // Good default for CJS in this context
        } else if (pattern.type === 'raw_esm_module') {
          content = args[0];
          language = 'tsx'; // Assume TSX for imports/exports in this stack
          filePath = this._inferFileNameFromContent(content, language);
        } else {
          // file_path, explicit_create, in_filename patterns
          [filePath, language, content] = args;
        }

        // Check if this should be treated as a shell command instead of a file
        if (this._isShellCommand(content, language)) {
          processed.add(blockHash);
          return this._wrapInShellAction(content, messageId);
        }

        // Clean up the file path
        filePath = this._normalizeFilePath(filePath);

        // Validate file path
        if (!this._isValidFilePath(filePath)) {
          return match; // Return original if invalid
        }

        // Check if there's proper context for file creation
        if (!this._hasFileContext(enhanced, match)) {
          // If no clear file context, skip unless it's an explicit file pattern
          const isExplicitFilePattern =
            pattern.type === 'explicit_create' || pattern.type === 'comment_filename' || pattern.type === 'file_path';

          if (!isExplicitFilePattern) {
            return match; // Return original if no context
          }
        }

        // Mark as processed
        processed.add(blockHash);

        // Generate artifact wrapper
        const artifactId = `artifact-${messageId}-${this._artifactCounter++}`;
        const wrapped = this._wrapInArtifact(artifactId, filePath, content);

        return wrapped;
      });
    }

    // Also detect standalone file operations without code blocks
    const fileOperationPattern =
      /(?:create|write|save|generate)\s+(?:a\s+)?(?:new\s+)?file\s+(?:at\s+)?[`'"]*([\/\w\-\.]+\.\w+)[`'"]*\s+with\s+(?:the\s+)?(?:following\s+)?content:?\s*\n([\s\S]+?)(?=\n\n|\n(?:create|write|save|generate|now|next|then|finally)|$)/gi;

    enhanced = enhanced.replace(fileOperationPattern, (match, filePath, content) => {
      const blockHash = this._hashBlock(match);

      if (processed.has(blockHash)) {
        return match;
      }

      filePath = this._normalizeFilePath(filePath);

      if (!this._isValidFilePath(filePath)) {
        return match;
      }

      processed.add(blockHash);

      const artifactId = `artifact-${messageId}-${this._artifactCounter++}`;

      // Clean content - remove leading/trailing whitespace but preserve indentation
      content = content.trim();

      const wrapped = this._wrapInArtifact(artifactId, filePath, content);

      return wrapped;
    });

    return enhanced;
  }

  private _wrapInArtifact(artifactId: string, filePath: string, content: string): string {
    const title = filePath.split('/').pop() || 'File';

    return `<boltArtifact id="${artifactId}" title="${title}" type="bundled">
<boltAction type="file" filePath="${filePath}">
${content}
</boltAction>
</boltArtifact>`;
  }

  private _wrapInShellAction(content: string, messageId: string): string {
    const artifactId = `artifact-${messageId}-${this._artifactCounter++}`;

    return `<boltArtifact id="${artifactId}" title="Shell Command" type="shell">
<boltAction type="shell">
${content.trim()}
</boltAction>
</boltArtifact>`;
  }

  private _normalizeFilePath(filePath: string): string {
    // Remove quotes, backticks, and clean up
    filePath = filePath.replace(/[`'"]/g, '').trim();

    // Ensure forward slashes
    filePath = filePath.replace(/\\/g, '/');

    // Remove leading ./ if present
    if (filePath.startsWith('./')) {
      filePath = filePath.substring(2);
    }

    // Add leading slash if missing and not a relative path
    if (!filePath.startsWith('/') && !filePath.startsWith('.')) {
      filePath = '/' + filePath;
    }

    return filePath;
  }

  private _isValidFilePath(filePath: string): boolean {
    // Check for valid file extension
    const hasExtension = /\.\w+$/.test(filePath);

    if (!hasExtension) {
      return false;
    }

    // Check for valid characters
    const isValid = /^[\/\w\-\.]+$/.test(filePath);

    if (!isValid) {
      return false;
    }

    // Exclude certain patterns that are likely not real files
    const excludePatterns = [
      /^\/?(tmp|temp|test|example)\//i,
      /\.(tmp|temp|bak|backup|old|orig)$/i,
      /^\/?(output|result|response)\//i, // Common AI response folders
      /^code_\d+\.(sh|bash|zsh)$/i, // Auto-generated shell files (our target issue)
      /^(untitled|new|demo|sample)\d*\./i, // Generic demo names
    ];

    for (const pattern of excludePatterns) {
      if (pattern.test(filePath)) {
        return false;
      }
    }

    return true;
  }

  private _hasFileContext(input: string, codeBlockMatch: string): boolean {
    // Check if there's explicit file context around the code block
    const matchIndex = input.indexOf(codeBlockMatch);

    if (matchIndex === -1) {
      return false;
    }

    // Look for context before the code block
    const beforeContext = input.substring(Math.max(0, matchIndex - 200), matchIndex);
    const afterContext = input.substring(matchIndex + codeBlockMatch.length, matchIndex + codeBlockMatch.length + 100);

    const fileContextPatterns = [
      /\b(create|write|save|add|update|modify|edit|generate)\s+(a\s+)?(new\s+)?file/i,
      /\b(file|filename|filepath)\s*[:=]/i,
      /\b(in|to|as)\s+[`'"]?[\w\-\.\/]+\.[a-z]{2,4}[`'"]?/i,
      /\b(component|module|class|function)\s+\w+/i,
    ];

    const contextText = beforeContext + afterContext;

    return fileContextPatterns.some((pattern) => pattern.test(contextText));
  }

  private _inferFileNameFromContent(content: string, language: string): string {
    // Try to infer component name from content
    const componentMatch = content.match(
      /(?:function|class|const|export\s+default\s+function|export\s+function)\s+(\w+)/,
    );

    if (componentMatch) {
      const name = componentMatch[1];
      const ext = language === 'jsx' ? '.jsx' : language === 'tsx' ? '.tsx' : '.js';

      return `/components/${name}${ext}`;
    }

    // Check for App component
    if (content.includes('function App') || content.includes('const App')) {
      return '/App.jsx';
    }

    // Default to a generic name
    return `/component-${Date.now()}.jsx`;
  }

  private _hashBlock(content: string): string {
    // Simple hash for identifying processed blocks
    let hash = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }

  private _isShellCommand(content: string, language: string): boolean {
    // Check if language suggests shell execution
    const shellLanguages = ['bash', 'sh', 'shell', 'zsh', 'fish', 'powershell', 'ps1'];
    const isShellLang = shellLanguages.includes(language.toLowerCase());

    if (!isShellLang) {
      return false;
    }

    const trimmedContent = content.trim();
    const lines = trimmedContent
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    // Empty content is not a command
    if (lines.length === 0) {
      return false;
    }

    // First, check if it looks like script content (should NOT be treated as commands)
    if (this._looksLikeScriptContent(trimmedContent)) {
      return false; // This is a script file, not commands to execute
    }

    // Single line commands are likely to be executed
    if (lines.length === 1) {
      return this._isSingleLineCommand(lines[0]);
    }

    // Multi-line: check if it's a command sequence
    return this._isCommandSequence(lines);
  }

  private _isSingleLineCommand(line: string): boolean {
    // Check for command chains with &&, ||, |, ;
    const hasChaining = /[;&|]{1,2}/.test(line);

    if (hasChaining) {
      // Split by chaining operators and check if parts look like commands
      const parts = line.split(/[;&|]{1,2}/).map((p) => p.trim());
      return parts.every((part) => part.length > 0 && !this._looksLikeScriptContent(part));
    }

    // Check for common command prefix patterns
    const prefixPatterns = [
      /^sudo\s+/, // sudo commands
      /^time\s+/, // time profiling
      /^nohup\s+/, // background processes
      /^watch\s+/, // repeated execution
      /^env\s+\w+=\w+\s+/, // environment variable setting
    ];

    // Remove prefixes to check the actual command
    let cleanLine = line;

    for (const prefix of prefixPatterns) {
      cleanLine = cleanLine.replace(prefix, '');
    }

    // Optimized O(1) lookup using Map
    for (const [, pattern] of this._commandPatternMap) {
      if (pattern.test(cleanLine)) {
        return true;
      }
    }

    // Fallback to simple command detection
    return this._isSimpleCommand(cleanLine);
  }

  private _isCommandSequence(lines: string[]): boolean {
    // If most lines look like individual commands, treat as command sequence
    const commandLikeLines = lines.filter(
      (line) =>
        line.length > 0 && !line.startsWith('#') && (this._isSingleLineCommand(line) || this._isSimpleCommand(line)),
    );

    // If more than 70% of non-comment lines are commands, treat as command sequence
    return commandLikeLines.length / lines.length > 0.7;
  }

  private _isSimpleCommand(line: string): boolean {
    // Simple heuristics for basic commands
    const words = line.split(/\s+/);

    if (words.length === 0) {
      return false;
    }

    const firstWord = words[0];

    // Don't treat variable assignments as commands (script-like)
    if (line.includes('=') && !line.startsWith('export ') && !line.startsWith('env ') && !firstWord.includes('=')) {
      return false;
    }

    // Don't treat function definitions as commands
    if (line.includes('function ') || line.match(/^\w+\s*\(\s*\)/)) {
      return false;
    }

    // Don't treat control structures as commands
    if (/^(if|for|while|case|function|until|select)\s/.test(line)) {
      return false;
    }

    // Don't treat here-documents as commands
    if (line.includes('<<') || line.startsWith('EOF') || line.startsWith('END')) {
      return false;
    }

    // Don't treat multi-line strings as commands
    if (line.includes('"""') || line.includes("'''")) {
      return false;
    }

    // Additional command-like patterns (fallback for unmatched commands)
    const commandLikePatterns = [
      /^[a-z][a-z0-9-_]*$/i, // Simple command names (like 'ls', 'grep', 'my-script')
      /^\.\/[a-z0-9-_./]+$/i, // Relative executable paths (like './script.sh', './bin/command')
      /^\/[a-z0-9-_./]+$/i, // Absolute executable paths (like '/usr/bin/command')
      /^[a-z][a-z0-9-_]*\s+-.+/i, // Commands with flags (like 'command --flag')
    ];

    // Check if the first word looks like a command
    const looksLikeCommand = commandLikePatterns.some((pattern) => pattern.test(firstWord));

    return looksLikeCommand;
  }

  private _looksLikeScriptContent(content: string): boolean {
    const lines = content.trim().split('\n');

    // Indicators that this is a script file rather than commands to execute
    const scriptIndicators = [
      /^#!/, // Shebang
      /function\s+\w+/, // Function definitions
      /^\w+\s*\(\s*\)\s*\{/, // Function definition syntax
      /^(if|for|while|case)\s+.*?(then|do|in)/, // Control structures
      /^\w+=[^=].*$/, // Variable assignments (not comparisons)
      /^(local|declare|readonly)\s+/,
      /^(source|\.)\s+/, // Source other scripts
      /^(exit|return)\s+\d+/, // Exit codes
    ];

    // Check each line for script indicators
    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
        continue; // Skip empty lines and comments
      }

      if (scriptIndicators.some((pattern) => pattern.test(trimmedLine))) {
        return true;
      }
    }

    return false;
  }

  private _detectAndWrapShellCommands(_messageId: string, input: string, processed: Set<string>): string {
    // Pattern to detect standalone shell code blocks that look like commands
    const shellCommandPattern = /```(bash|sh|shell|zsh|fish|powershell|ps1)\n([\s\S]*?)```/gi;

    return input.replace(shellCommandPattern, (match, language, content) => {
      const blockHash = this._hashBlock(match);

      if (processed.has(blockHash)) {
        return match;
      }

      // Check if this looks like commands to execute rather than a script file
      if (this._isShellCommand(content, language)) {
        processed.add(blockHash);
        return this._wrapInShellAction(content, _messageId);
      }

      // If it looks like a script, let the file detection patterns handle it
      return match;
    });
  }

  private _removeStyleObjects(input: string): string {
    // Remove style/theme configuration objects that shouldn't appear in chat
    // These are typically JavaScript objects with CSS-like properties

    // Pattern to detect style objects with properties like borderRadius, fontSize, color, etc.
    const styleObjectPattern = /^\s*(?:[\w]+:\s*(?:'[^']*'|"[^"]*"|\d+|#[0-9A-Fa-f]{3,6}|'transparent'|{\s*[^}]+\s*}),?\s*)+$/gm;

    // Remove lines that look like style definitions
    const lines = input.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) return true;

      // Check if line looks like a style property definition
      const isStyleProperty = /^(?:[\w]+:\s*(?:'[^']*'|"[^"]*"|\d+|#[0-9A-Fa-f]{3,6}|'transparent'|{\s*[^}]+\s*}),?\s*)$/.test(trimmed);

      // Check for common style property names
      const commonStyleProps = [
        'borderRadius', 'fontSize', 'fontWeight', 'color', 'backgroundColor',
        'padding', 'margin', 'alignItems', 'justifyContent', 'flexDirection',
        'borderColor', 'borderWidth', 'paddingVertical', 'paddingHorizontal'
      ];

      const hasStyleProp = commonStyleProps.some(prop => trimmed.startsWith(prop + ':'));

      // Filter out style property lines
      return !isStyleProperty && !hasStyleProp;
    });

    // If we filtered out more than 3 consecutive lines, it was likely a style object
    const filtered = filteredLines.join('\n');

    // Also remove standalone object literals that contain only style properties
    return filtered.replace(/\{[\s\S]*?(?:borderRadius|fontSize|fontWeight|color|backgroundColor|padding|margin|alignItems)[\s\S]*?\}/g, (match) => {
      // Only remove if it's a pure style object (contains multiple style properties)
      const stylePropsCount = (match.match(/(?:borderRadius|fontSize|fontWeight|color|backgroundColor|padding|margin|alignItems|justifyContent)/g) || []).length;
      return stylePropsCount >= 3 ? '' : match;
    });
  }

  private _wrapPackageJSON(messageId: string, input: string): string {
    // Detect package.json content and wrap it in artifact tags to prevent it from appearing in chat

    // Calculate ranges of existing artifacts and ACTIONS to avoid double wrapping
    // We need to check both because incomplete artifacts might expose raw actions
    const artifactRanges = this._findArtifactRanges(input);
    const actionRanges = this._findActionRanges(input);

    let buffer = input;
    let modified = '';
    let currIndex = 0;


    while (currIndex < buffer.length) {
      // Find start of JSON object
      const startIndex = buffer.indexOf('{', currIndex);

      if (startIndex === -1) {
        modified += buffer.slice(currIndex);
        break;
      }

      // Add text before the object
      modified += buffer.slice(currIndex, startIndex);

      // Find the matching closing brace, respecting strings
      let braceCount = 1;
      let endIndex = -1;
      let inString = false;
      let isEscaped = false;

      for (let i = startIndex + 1; i < buffer.length; i++) {
        const char = buffer[i];

        if (char === '\n' && inString) {
          // Safety valve: reset string state on newlines to prevent getting stuck
          inString = false;
          isEscaped = false;
          continue;
        }

        if (inString) {
          if (char === '\\' && !isEscaped) {
            isEscaped = true;
          } else if (char === '"' && !isEscaped) {
            inString = false;
          } else {
            isEscaped = false;
          }
          continue;
        }

        if (char === '"') {
          inString = true;
          continue;
        }

        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex === -1) {
        // No matching closing brace found (incomplete JSON or streaming)
        // Just append the rest and stop
        modified += buffer.slice(startIndex);
        break;
      }

      // Check if this block is already inside an artifact OR an action
      // Checking action ranges specifically guards against the case where an artifact wrapper exists 
      // but we are deep inside the action content
      if (this._isInsideArtifact(startIndex, artifactRanges) || this._isInsideAction(startIndex, actionRanges)) {
        modified += buffer.slice(startIndex, endIndex + 1);
        currIndex = endIndex + 1;
        continue;
      }

      const jsonCandidate = buffer.slice(startIndex, endIndex + 1);

      // Check if this block looks like a package.json
      // We check for presence of multiple common keys
      const packetJsonKeysRegex = /"(?:name|version|scripts|dependencies|devDependencies|main)"/g;
      const matchedKeys = jsonCandidate.match(packetJsonKeysRegex) || [];
      const uniqueKeys = new Set(matchedKeys);

      if (uniqueKeys.size >= 2) {
        // It's a package.json! Wrap it.
        const artifactId = `artifact-${messageId}-${this._artifactCounter++}`;
        const wrapped = `<boltArtifact id="${artifactId}" title="package.json" type="bundled">
<boltAction type="file" filePath="/package.json">
${jsonCandidate}
</boltAction>
</boltArtifact>`;

        modified += wrapped;
      } else {
        // Not a package.json, just append the text
        modified += jsonCandidate;
      }

      // Move index past this block
      currIndex = endIndex + 1;
    }

    return modified;
  }

  private _wrapDesignHandoffJSON(input: string): string {
    // Detect raw JSON that contains design handoff data
    // Look for JSON object with appName, description, and category fields
    // We need to find the complete JSON object, so we'll search for opening { and matching closing }

    // CRITICAL: Don't wrap if the input already contains artifact tags
    if (input.includes('<boltArtifact') || input.includes('<boltAction')) {
      return input;
    }

    // First check if the input contains the key fields
    if (!input.includes('"appName"') || !input.includes('"description"') || !input.includes('"category"')) {
      return input;
    }

    // Find the opening brace
    const startIndex = input.indexOf('{');
    if (startIndex === -1) {
      return input;
    }

    // Find the matching closing brace by counting braces
    let braceCount = 0;
    let endIndex = -1;
    for (let i = startIndex; i < input.length; i++) {
      if (input[i] === '{') braceCount++;
      if (input[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex === -1) {
      return input;
    }

    const jsonString = input.substring(startIndex, endIndex + 1);

    // Validate it's valid JSON
    try {
      JSON.parse(jsonString);
    } catch (e) {
      return input;
    }

    // Check if it's preceded by a handoff message
    const handoffMessagePattern = /(I've gathered all the initial information|I'm now handing off to the Design Wizard|handing off to the Design Wizard)/i;
    const hasHandoffMessage = handoffMessagePattern.test(input);

    if (!hasHandoffMessage) {
      return input;
    }

    // Replace the raw JSON with wrapped version
    const wrapped = `<boltArtifact id="design-handoff" title="Design Synchronization">
<boltAction type="design-sync">
${jsonString}
</boltAction>
</boltArtifact>`;

    return input.replace(jsonString, wrapped);
  }

  reset() {
    super.reset();
    this._processedCodeBlocks.clear();
    this._artifactCounter = 0;
  }
}
