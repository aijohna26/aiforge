export interface GeneratedFile {
  path: string;
  content: string;
  language?: string;
}

export interface GeneratedProject {
  id?: string;
  projectName: string;
  description?: string;
  files: GeneratedFile[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    filesCreated?: string[];
    tokens?: { input: number; output: number };
    cost?: number;
    snapshotId?: string; // ID for rollback functionality
    projectDetails?: {
      name: string;
      description?: string;
      userPrompt?: string;
    };
  };
  status?: 'thinking' | 'done' | 'error';
}

export interface SnackPreview {
  snackId: string;
  snackUrl: string;
  embedUrl: string;
  qrCodeData: string;
  qrCodeUrl: string;
}

export interface ExpoServer {
  id: string;
  status: "starting" | "running" | "stopped" | "error";
  expUrl: string;
  localUrl: string;
  tunnelUrl: string | null;
  webUrl: string; // URL for React Native Web preview
  qrCodeUrl: string;
  createdAt: number;
  lastAccessedAt?: number;
  error?: string;
  connectedDevices: number;
}
