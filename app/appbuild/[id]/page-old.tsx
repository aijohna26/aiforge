'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { CodeMirrorEditor, type EditorDocument } from '@/components/chef/editor/codemirror/CodeMirrorEditor';
import { FileTree } from '@/components/FileTree/FileTree';
import { Chat, type Message } from '@/components/chef/Chat';
import { BoltExpoPreview } from '@/components/Preview/BoltExpoPreview';
import { Loader2, Smartphone } from 'lucide-react';
import type { GeneratedFile } from '@/lib/types';

type FileMap = Record<string, { type: string; content: string }>;

const defaultAppFile = [
  "import { StatusBar } from 'expo-status-bar';",
  "import { StyleSheet, Text, View } from 'react-native';",
  '',
  'export default function App() {',
  '  return (',
  '    <View style={styles.container}>',
  "      <Text style={styles.title}>Welcome to Your Expo App!</Text>",
  "      <Text style={styles.subtitle}>Start editing to see changes</Text>",
  '      <StatusBar style="auto" />',
  '    </View>',
  '  );',
  '}',
  '',
  'const styles = StyleSheet.create({',
  '  container: {',
  '    flex: 1,',
  "    backgroundColor: '#fff',",
  "    alignItems: 'center',",
  "    justifyContent: 'center',",
  '    padding: 20,',
  '  },',
  '  title: {',
  '    fontSize: 24,',
  "    fontWeight: 'bold',",
  '    marginBottom: 8,',
  '  },',
  '  subtitle: {',
  '    fontSize: 16,',
  "    color: '#666',",
  '  },',
  '});',
].join('\n');

const defaultFileMap: FileMap = {
  '/App.tsx': {
    type: 'file',
    content: defaultAppFile,
  },
  '/package.json': {
    type: 'file',
    content: JSON.stringify(
      {
        name: 'my-expo-app',
        version: '1.0.0',
        main: 'expo-router/entry',
        private: true,
        scripts: {
          dev: 'EXPO_NO_TELEMETRY=1 expo start',
          'build:web': 'expo export --platform web',
        },
        dependencies: {
          expo: '~53.0.0',
          'expo-router': '~5.0.2',
          'expo-status-bar': '~2.2.2',
          'expo-constants': '~17.1.3',
          react: '18.3.1',
          'react-native': '0.79.1',
          'react-native-safe-area-context': '5.3.0',
          'react-native-screens': '~4.10.0',
        },
        devDependencies: {
          '@babel/core': '^7.25.2',
          '@types/react': '~19.0.10',
          typescript: '~5.8.3',
        },
      },
      null,
      2,
    ),
  },
  '/app.json': {
    type: 'file',
    content: JSON.stringify(
      {
        expo: {
          name: 'my-expo-app',
          slug: 'my-expo-app',
          version: '1.0.0',
          orientation: 'portrait',
          scheme: 'myapp',
          userInterfaceStyle: 'automatic',
          newArchEnabled: true,
          plugins: ['expo-router'],
          experiments: {
            typedRoutes: true,
          },
        },
      },
      null,
      2,
    ),
  },
  '/app/_layout.tsx': {
    type: 'file',
    content: `import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}`,
  },
  '/app/index.tsx': {
    type: 'file',
    content: `import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Your Expo App!</Text>
      <Text style={styles.subtitle}>Start editing to see changes</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});`,
  },
};

export default function AppBuildEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Validate if projectId looks like a Convex ID (starts with 'j' and has the right format)
  const isValidConvexId = Boolean(projectId?.match(/^j[a-z0-9]+$/));

  // Convex hooks
  const getProjectFiles = useAction(api.files.getProjectFiles);
  const updateFile = useAction(api.files.updateFile);
  const chatAction = useAction(api.ai.chat);

  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [editorDoc, setEditorDoc] = useState<EditorDocument | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [localFiles, setLocalFiles] = useState<FileMap>({});
  const [filesData, setFilesData] = useState<FileMap | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Load files on mount
  useEffect(() => {
    const loadFiles = async () => {
      if (!isValidConvexId) {
        // If no valid project ID, load bolt.diy's exact template
        try {
          console.log('[AppForge] Loading bolt.diy template...');
          const response = await fetch('/api/bolt-template');
          if (!response.ok) {
            throw new Error(`Failed to load bolt template: ${response.statusText}`);
          }
          const data = await response.json();
          const boltFiles = data.files;

          console.log('[AppForge] Bolt template loaded:', Object.keys(boltFiles).length, 'files');
          console.log('[AppForge] File paths:', Object.keys(boltFiles));
          setFilesData(boltFiles);
          setLocalFiles(boltFiles);
          setIsLoadingFiles(false);

          // Select the first .tsx or .ts file found in app/ directory
          const firstFile = Object.keys(boltFiles).find(f => f.startsWith('/app/') && (f.endsWith('.tsx') || f.endsWith('.ts'))) || Object.keys(boltFiles)[0];
          if (!selectedFile && firstFile) {
            setSelectedFile(firstFile);
          }
        } catch (error) {
          console.error('[AppForge] Failed to load bolt template:', error);
          // Fallback to default template
          setFilesData(defaultFileMap);
          setLocalFiles(defaultFileMap);
          setIsLoadingFiles(false);
          if (!selectedFile) {
            setSelectedFile('/App.tsx');
          }
        }
      } else {
        // Load from Convex
        try {
          const files = await getProjectFiles({ projectId: projectId as Id<'chats'> });
          setFilesData(files);
          setLocalFiles(files);
          setIsLoadingFiles(false);
          if (!selectedFile && files['/App.tsx']) {
            setSelectedFile('/App.tsx');
          }
        } catch (error) {
          console.error('Failed to load files:', error);
          setIsLoadingFiles(false);
        }
      }
    };

    loadFiles();
  }, [projectId, isValidConvexId]);

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
    console.log('[AppForge] File selected:', filePath, '-> normalized:', normalizedPath);

    const file = localFiles[normalizedPath];
    if (file && file.type === 'file') {
      setSelectedFile(normalizedPath);
      console.log('[AppForge] Selected file updated to:', normalizedPath);
    } else {
      console.warn('[AppForge] File not found or not a file type:', normalizedPath, file);
    }
  }, [localFiles]);

  const handleEditorChange = useCallback(
    async (update: { content: string; filePath: string }) => {
      // Update local state immediately for responsiveness
      setLocalFiles((prev) => ({
        ...prev,
        [update.filePath]: {
          ...prev[update.filePath],
          content: update.content,
        },
      }));

      // Only save to Convex if we have a valid project ID
      if (!isValidConvexId) {
        return; // Skip save for demo/test projects
      }

      // Save to Convex (debounced in real implementation)
      try {
        await updateFile({
          projectId: projectId as Id<'chats'>,
          filePath: update.filePath,
          content: update.content,
        });
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    },
    [projectId, updateFile, isValidConvexId]
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

      // Check if we have a valid project ID
      if (!isValidConvexId) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'AI chat is only available for saved projects. Please create a new project to use AI assistance.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsStreaming(false);
        return;
      }

      try {
        // Build context about current project
        const filesList = Object.keys(localFiles).join(', ');
        const currentFileContent = selectedFile && localFiles[selectedFile]
          ? `\n\nCurrent file (${selectedFile}):\n\`\`\`\n${localFiles[selectedFile].content}\n\`\`\``
          : '';

        const systemPrompt = `You are an expert Expo React Native developer assistant.

Project context:
- This is an Expo React Native project
- Available files: ${filesList}${currentFileContent}

Guidelines:
- Provide code suggestions for Expo/React Native
- Use TypeScript
- Follow React Native best practices
- Keep explanations clear and concise
- When suggesting code changes, specify which file to modify`;

        // Build message history for AI
        const aiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: 'user' as const, content: message },
        ];

        // Call AI via Convex action
        const response = await chatAction({
          projectId: projectId as Id<'chats'>,
          messages: aiMessages,
          provider: 'openai',
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(false);
      } catch (error) {
        console.error('Failed to send message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsStreaming(false);
      }
    },
    [projectId, messages, chatAction, isValidConvexId, localFiles, selectedFile]
  );

  // Show loading while files are being loaded
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

  // Convert FileMap to GeneratedFile[] for FileTree
  const filesArray: GeneratedFile[] = Object.entries(localFiles)
    .filter(([_, file]) => file.type === 'file')
    .map(([path, file]) => ({
      path,
      content: file.content || '',
    }));

  return (
    <div className="flex h-screen bg-slate-950">
      {/* File Tree Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Files ({filesArray.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
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

      {/* Main Editor Area */}
      <div className="flex flex-1 flex-col">
        {/* Editor Header */}
        <div className="border-b border-slate-800 bg-slate-900 px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">{selectedFile || 'No file selected'}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Smartphone className="h-4 w-4" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                onClick={() => router.push('/appbuild')}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>

        {/* Code Editor or Image Viewer */}
        <div className="flex-1">
          {selectedFile && /\.(png|jpg|jpeg|gif|ico|bmp|webp|svg)$/i.test(selectedFile) &&
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
          )}
        </div>
      </div>

      {/* Right Sidebar - Chat or Preview */}
      <div className={`${showPreview ? 'w-[600px]' : 'w-96'} border-l border-slate-800 bg-slate-900`}>
        {showPreview ? (
          <BoltExpoPreview files={localFiles} onClose={() => setShowPreview(false)} />
        ) : (
          <>
            <div className="border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-200">AI Assistant</h2>
            </div>
            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              placeholder="Ask AI to modify your code..."
              className="h-[calc(100vh-52px)]"
            />
          </>
        )}
      </div>
    </div>
  );
}
