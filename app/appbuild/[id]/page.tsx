'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CodeMirrorEditor, type EditorDocument } from '@/components/chef/editor/codemirror/CodeMirrorEditor';
import { FileTree } from '@/components/FileTree/FileTree';
import { Chat, type Message } from '@/components/chef/Chat';
import { BoltExpoPreview } from '@/components/Preview/BoltExpoPreview';
import { Loader2, Smartphone, Download, Share, Settings, Code2, GitCompare, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Terminal } from '@/components/Terminal/Terminal';
import type { GeneratedFile } from '@/lib/types';

type FileMap = Record<string, { type: string; content: string }>;

const defaultFileMap: FileMap = {
  '/app/_layout.tsx': {
    type: 'file',
    content: `import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}`,
  },
};

export default function AppBuildEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Validate if projectId looks like a Convex ID
  const isValidConvexId = Boolean(projectId?.match(/^j[a-z0-9]+$/));

  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [editorDoc, setEditorDoc] = useState<EditorDocument | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [localFiles, setLocalFiles] = useState<FileMap>({});
  const [filesData, setFilesData] = useState<FileMap | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<'code' | 'diff' | 'preview'>('code');
  const [showTerminal, setShowTerminal] = useState(true);

  // Load files on mount
  useEffect(() => {
    const loadFiles = async () => {
      if (!isValidConvexId) {
        // Load bolt.diy's exact template
        try {
          console.log('[AppForge] Loading bolt.diy template...');
          const response = await fetch('/api/bolt-template');
          if (!response.ok) {
            throw new Error(`Failed to load bolt template: ${response.statusText}`);
          }
          const data = await response.json();
          const boltFiles = data.files;

          console.log('[AppForge] Bolt template loaded:', Object.keys(boltFiles).length, 'files');
          setFilesData(boltFiles);
          setLocalFiles(boltFiles);
          setIsLoadingFiles(false);

          const firstFile = Object.keys(boltFiles).find(f => f.startsWith('/app/') && (f.endsWith('.tsx') || f.endsWith('.ts'))) || Object.keys(boltFiles)[0];
          if (!selectedFile && firstFile) {
            setSelectedFile(firstFile);
          }
        } catch (error) {
          console.error('[AppForge] Failed to load bolt template:', error);
          setFilesData(defaultFileMap);
          setLocalFiles(defaultFileMap);
          setIsLoadingFiles(false);
          if (!selectedFile) {
            setSelectedFile('/app/_layout.tsx');
          }
        }
      }
    };

    loadFiles();
  }, [projectId, isValidConvexId, selectedFile]);

  // Update editor document when file is selected
  useEffect(() => {
    if (selectedFile && localFiles[selectedFile]) {
      // Check if file is binary (images, etc.)
      const isBinaryFile = /\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf|mp4|webm|wav|mp3|pdf|zip|tar|gz)$/i.test(selectedFile);

      setEditorDoc({
        filePath: selectedFile,
        value: isBinaryFile
          ? `Binary file: ${selectedFile}\n\nThis file cannot be edited in the text editor.`
          : localFiles[selectedFile].content || '',
        isBinary: isBinaryFile,
      });
    }
  }, [selectedFile, localFiles]);

  const handleFileSelect = useCallback((filePath: string) => {
    // Ensure path starts with /
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    const file = localFiles[normalizedPath];
    if (file && file.type === 'file') {
      setSelectedFile(normalizedPath);
    }
  }, [localFiles]);

  const handleEditorChange = useCallback(
    async (update: { content: string; filePath: string }) => {
      setLocalFiles((prev) => ({
        ...prev,
        [update.filePath]: {
          ...prev[update.filePath],
          content: update.content,
        },
      }));
    },
    []
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      if (!isValidConvexId) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'AI chat is only available for saved projects.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsStreaming(false);
        return;
      }

      setIsStreaming(false);
    },
    [isValidConvexId]
  );

  // Convert FileMap to GeneratedFile[] for FileTree
  const filesArray: GeneratedFile[] = Object.entries(localFiles)
    .filter(([_, file]) => file.type === 'file')
    .map(([path, file]) => ({
      path,
      content: file.content || '',
    }));

  if (isLoadingFiles) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-slate-400">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/appbuild')}
            className="text-slate-400 hover:text-white"
          >
            ← Back
          </Button>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              APPFORGE AI
            </p>
            <h1 className="text-2xl font-bold text-white">Editor</h1>
            <p className="text-xs text-slate-400">Bolt Expo Template</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800"
            onClick={() => { }}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800"
            onClick={() => { }}
          >
            <Download className="h-4 w-4" />
            Export Code
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            onClick={() => setShowPreview(true)}
          >
            <Share className="h-4 w-4" />
            Launch
          </button>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="grid flex-1 grid-cols-[320px_1fr_400px] overflow-hidden">
        {/* Left: AI Chat Panel */}
        <div className="overflow-hidden border-r border-slate-800">
          <Chat
            messages={messages}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            placeholder="Ask AI to modify your code..."
            className="h-full"
          />
        </div>

        {/* Middle: FileTree + Code Editor */}
        <div className="grid grid-cols-[260px_1fr] border-r border-slate-800 overflow-hidden">
          {/* FileTree */}
          <div className="overflow-hidden bg-slate-900">
            <div className="border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Files ({filesArray.length})
              </h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-52px)]">
              {filesArray.length > 0 ? (
                <FileTree
                  files={filesArray}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                />
              ) : (
                <div className="p-4 text-sm text-slate-400">Loading files...</div>
              )}
            </div>
          </div>

          {/* Code Editor with Tabs and Terminal */}
          <div className="bg-slate-950 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-900/50 px-2">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'code'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Code2 className="h-4 w-4" />
                Code
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'diff'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <GitCompare className="h-4 w-4" />
                Diff
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'preview'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            </div>

            {/* Editor Area - Dynamic height based on terminal */}
            <div className={`overflow-hidden ${showTerminal ? 'flex-[3]' : 'flex-1'}`}>
              {activeTab === 'code' ? (
                selectedFile && /\.(png|jpg|jpeg|gif|ico|bmp|webp|svg)$/i.test(selectedFile) &&
                  localFiles[selectedFile]?.content?.startsWith('data:image') ? (
                  <div className="flex h-full items-center justify-center bg-slate-950 p-8">
                    <div className="max-w-4xl">
                      <img
                        src={localFiles[selectedFile].content}
                        alt={selectedFile}
                        className="max-h-[80vh] w-auto rounded-lg shadow-2xl"
                        style={{ imageRendering: 'crisp-edges' }}
                      />
                      <p className="mt-4 text-center text-sm text-slate-400">{selectedFile}</p>
                    </div>
                  </div>
                ) : (
                  <CodeMirrorEditor
                    theme="dark"
                    doc={editorDoc}
                    scrollToDocAppend={false}
                    editable={true}
                    onChange={handleEditorChange}
                  />
                )
              ) : activeTab === 'diff' ? (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <div className="text-slate-400">
                    <GitCompare className="mx-auto h-12 w-12 mb-3 text-slate-600" />
                    <p>Diff view coming soon</p>
                    <p className="text-xs mt-2 text-slate-500">Compare changes between versions</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <div className="text-slate-400">
                    <Eye className="mx-auto h-12 w-12 mb-3 text-slate-600" />
                    <p>Use the Preview panel on the right</p>
                    <p className="text-xs mt-2 text-slate-500">Live preview with Expo QR code</p>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Area - Collapsible */}
            <div className={`flex-[2] border-t border-slate-800 overflow-hidden ${showTerminal ? '' : 'hidden'}`}>
              <Terminal />
            </div>

            {/* Terminal Toggle Button */}
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className="flex items-center justify-center gap-2 border-t border-slate-800 bg-slate-900/50 px-4 py-2 text-xs text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
            >
              {showTerminal ? (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Hide Terminal
                </>
              ) : (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show Terminal
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="overflow-hidden bg-slate-900">
          {showPreview ? (
            <BoltExpoPreview files={localFiles} onClose={() => setShowPreview(false)} />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <Smartphone className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                <p className="text-slate-400 mb-4">Preview closed</p>
                <Button onClick={() => setShowPreview(true)}>Show Preview</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
