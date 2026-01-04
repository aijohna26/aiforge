import { useStore } from '@nanostores/react';
import { memo, useMemo, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { shortcutEventEmitter } from '~/lib/hooks'; // Check if this hook exists or import correctly
import * as Tabs from '@radix-ui/react-tabs';
import {
  CodeMirrorEditor,
  type EditorDocument,
  type EditorSettings,
  type OnChangeCallback as OnEditorChange,
  type OnSaveCallback as OnEditorSave,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { PanelHeader } from '~/components/ui/PanelHeader';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import type { FileMap } from '~/lib/stores/files';
import type { FileHistory } from '~/types/actions';
import { themeStore } from '~/lib/stores/theme';
import { WORK_DIR } from '~/utils/constants';
import { renderLogger } from '~/utils/logger';
import { isMobile } from '~/utils/mobile';
import { FileBreadcrumb } from './FileBreadcrumb';
import { FileTree } from './FileTree';
import { DEFAULT_TERMINAL_SIZE, TerminalTabs } from './terminal/TerminalTabs';
import { workbenchStore } from '~/lib/stores/workbench';
import { Search } from './Search';
import { classNames } from '~/utils/classNames';
import { LockManager } from './LockManager';
import { ImageViewer } from './ImageViewer';
import { useRef, useEffect } from 'react';

// ... interface defaults ...
interface EditorPanelProps {
  files?: FileMap;
  unsavedFiles?: Set<string>;
  editorDocument?: EditorDocument;
  selectedFile?: string | undefined;
  isStreaming?: boolean;
  fileHistory?: Record<string, FileHistory>;
  onEditorChange?: OnEditorChange;
  onEditorScroll?: OnEditorScroll;
  onFileSelect?: (value?: string) => void;
  onFileSave?: OnEditorSave;
  onFileReset?: () => void;
}

const DEFAULT_EDITOR_SIZE = 100 - DEFAULT_TERMINAL_SIZE;

const editorSettings: EditorSettings = { tabSize: 2 };

export const EditorPanel = memo(
  ({
    files,
    unsavedFiles,
    editorDocument,
    // ... props
    selectedFile,
    isStreaming,
    fileHistory,
    onFileSelect,
    onEditorChange,
    onEditorScroll,
    onFileSave,
    onFileReset,
  }: EditorPanelProps) => {
    renderLogger.trace('EditorPanel');

    const theme = useStore(themeStore);
    const showTerminal = useStore(workbenchStore.showTerminal);

    const terminalPanelRef = useRef<ImperativePanelHandle>(null);
    const terminalToggledByShortcut = useRef(false);

    useEffect(() => {
      const { current: terminal } = terminalPanelRef;

      if (!terminal) {
        return;
      }

      const isCollapsed = terminal.isCollapsed();

      if (!showTerminal && !isCollapsed) {
        terminal.collapse();
      } else if (showTerminal && isCollapsed) {
        terminal.resize(DEFAULT_TERMINAL_SIZE);
      }

      terminalToggledByShortcut.current = false;
    }, [showTerminal]);

    useEffect(() => {
      const unsubscribeFromEventEmitter = shortcutEventEmitter.on('toggleTerminal', () => {
        terminalToggledByShortcut.current = true;
      });

      return () => {
        unsubscribeFromEventEmitter();
      };
    }, []);



    const activeFileSegments = useMemo(() => {
      if (!editorDocument) {
        return undefined;
      }

      return editorDocument.filePath.split('/');
    }, [editorDocument]);

    const activeFileUnsaved = useMemo(() => {
      if (!editorDocument || !unsavedFiles) {
        return false;
      }

      // Make sure unsavedFiles is a Set before calling has()
      return unsavedFiles instanceof Set && unsavedFiles.has(editorDocument.filePath);
    }, [editorDocument, unsavedFiles]);

    return (
      <PanelGroup direction="vertical">
        <Panel defaultSize={showTerminal ? DEFAULT_EDITOR_SIZE : 100} minSize={20}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={25} minSize={20} collapsible className="border-r border-bolt-elements-borderColor">
              <div className="flex flex-col h-full bg-bolt-elements-background-depth-2">
                <Tabs.Root defaultValue="files" className="flex flex-col h-full">
                  <div className="px-2 py-1 border-b border-bolt-elements-borderColor shadow-sm">
                    <Tabs.List className="flex gap-1 justify-between">
                      <div className="flex gap-1">
                        <Tabs.Trigger
                          value="files"
                          className={classNames(
                            'px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors focus:outline-none',
                            'data-[state=active]:bg-bolt-elements-background-depth-1 data-[state=active]:text-bolt-elements-textPrimary data-[state=active]:border-b-2 data-[state=active]:border-accent-500',
                            'text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary',
                          )}
                        >
                          Files
                        </Tabs.Trigger>
                        <Tabs.Trigger
                          value="search"
                          className={classNames(
                            'px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors focus:outline-none',
                            'data-[state=active]:bg-bolt-elements-background-depth-1 data-[state=active]:text-bolt-elements-textPrimary data-[state=active]:border-b-2 data-[state=active]:border-accent-500',
                            'text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary',
                          )}
                        >
                          Search
                        </Tabs.Trigger>
                      </div>
                    </Tabs.List>
                  </div>

                  <Tabs.Content
                    value="files"
                    className="flex-1 overflow-hidden flex flex-col focus:outline-none bg-bolt-elements-background-depth-1 data-[state=inactive]:hidden"
                  >
                    <div className="flex-1 overflow-y-auto">
                      <FileTree
                        className="h-full"
                        files={files}
                        hideRoot
                        unsavedFiles={unsavedFiles}
                        fileHistory={fileHistory}
                        rootFolder={WORK_DIR}
                        selectedFile={selectedFile}
                        onFileSelect={onFileSelect}
                      />
                    </div>
                  </Tabs.Content>

                  <Tabs.Content
                    value="search"
                    className="flex-1 overflow-hidden flex flex-col focus:outline-none bg-bolt-elements-background-depth-1 data-[state=inactive]:hidden"
                  >
                    <div className="flex-1 overflow-y-auto px-4 py-2">
                      <Search />
                    </div>
                  </Tabs.Content>
                </Tabs.Root>
              </div>
            </Panel>

            <PanelResizeHandle />

            <Panel className="flex flex-col" defaultSize={75} minSize={20}>
              <PanelHeader className="overflow-x-auto">
                {activeFileSegments?.length && (
                  <div className="flex items-center flex-1 text-sm">
                    <FileBreadcrumb pathSegments={activeFileSegments} files={files} onFileSelect={onFileSelect} />
                    {activeFileUnsaved && (
                      <div className="flex gap-1 ml-auto -mr-1.5">
                        <PanelHeaderButton onClick={onFileSave}>
                          <div className="i-ph:floppy-disk-duotone" />
                          Save
                        </PanelHeaderButton>
                        <PanelHeaderButton onClick={onFileReset}>
                          <div className="i-ph:clock-counter-clockwise-duotone" />
                          Reset
                        </PanelHeaderButton>
                      </div>
                    )}
                  </div>
                )}
              </PanelHeader>
              <div className="h-full flex-1 overflow-hidden modern-scrollbar">
                {editorDocument?.isBinary && /\.(jpe?g|png|gif|svg|webp|ico)$/i.test(editorDocument.filePath) ? (
                  <ImageViewer
                    base64Content={editorDocument.value}
                    fileName={editorDocument.filePath.split('/').pop() || ''}
                  />
                ) : (
                  <CodeMirrorEditor
                    theme={theme}
                    editable={!isStreaming && editorDocument !== undefined}
                    settings={editorSettings}
                    doc={editorDocument}
                    autoFocusOnDocumentChange={!isMobile()}
                    onScroll={onEditorScroll}
                    onChange={onEditorChange}
                    onSave={onFileSave}
                  />
                )}
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle />
        <Panel
          ref={terminalPanelRef}
          defaultSize={showTerminal ? DEFAULT_TERMINAL_SIZE : 0}
          minSize={10}
          collapsible
          onExpand={() => {
            if (!terminalToggledByShortcut.current) {
              workbenchStore.toggleTerminal(true);
            }
          }}
          onCollapse={() => {
            if (!terminalToggledByShortcut.current) {
              workbenchStore.toggleTerminal(false);
            }
          }}
        >
          <TerminalTabs />
        </Panel>
      </PanelGroup>
    );
  },
);
