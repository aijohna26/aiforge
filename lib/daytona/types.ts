/**
 * Daytona sandbox configuration options
 */
export interface SandboxConfig {
    /** Programming language for the sandbox environment */
    language?: 'typescript' | 'python' | 'javascript';
    /** Environment variables to set in the sandbox */
    envVars?: Record<string, string>;
    /** Timeout in seconds for sandbox operations */
    timeout?: number;
}

/**
 * Result of code execution in a sandbox
 */
export interface CodeExecutionResult {
    /** Standard output from code execution */
    stdout: string;
    /** Standard error from code execution */
    stderr: string;
    /** Exit code (0 = success, non-zero = error) */
    exitCode: number;
    /** Artifacts generated during execution (charts, files, etc.) */
    artifacts?: {
        charts?: Array<{ png?: string }>;
    };
}

/**
 * Preview link for accessing a running sandbox web application
 */
export interface PreviewLink {
    /** Public URL to access the preview */
    url: string;
    /** Authentication token for private previews */
    token: string;
}
