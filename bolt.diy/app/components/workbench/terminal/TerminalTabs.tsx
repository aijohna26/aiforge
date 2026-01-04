import { useStore } from '@nanostores/react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Panel, type ImperativePanelHandle } from 'react-resizable-panels';
import { IconButton } from '~/components/ui/IconButton';
import { shortcutEventEmitter } from '~/lib/hooks';
import { themeStore } from '~/lib/stores/theme';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { Terminal, type TerminalRef } from './Terminal';
import { TerminalManager } from './TerminalManager';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Terminal');

const MAX_TERMINALS = 3;

export const DEFAULT_TERMINAL_SIZE = 25;

export const TerminalTabs = memo(() => {
  const theme = useStore(themeStore);
  // Remove showTerminal dependency if we don't need it for internal logic anymore
  // But we might need it for rendering quirks? No, Panel handles visibility.
  const showTerminal = useStore(workbenchStore.showTerminal);

  const terminalRefs = useRef<Map<number, TerminalRef>>(new Map());
  // Removed terminalPanelRef and terminalToggledByShortcut

  const [activeTerminal, setActiveTerminal] = useState(0);
  const [terminalCount, setTerminalCount] = useState(0);

  const addTerminal = () => {
    if (terminalCount < MAX_TERMINALS) {
      setTerminalCount(terminalCount + 1);
      setActiveTerminal(terminalCount);
    }
  };

  const closeTerminal = useCallback(
    (index: number) => {
      if (index === 0) {
        return;
      } // Can't close bolt terminal

      const terminalRef = terminalRefs.current.get(index);

      if (terminalRef?.getTerminal) {
        const terminal = terminalRef.getTerminal();

        if (terminal) {
          workbenchStore.detachTerminal(terminal);
        }
      }

      // Remove the terminal from refs
      terminalRefs.current.delete(index);

      // Adjust terminal count and active terminal
      setTerminalCount(terminalCount - 1);

      if (activeTerminal === index) {
        setActiveTerminal(Math.max(0, index - 1));
      } else if (activeTerminal > index) {
        setActiveTerminal(activeTerminal - 1);
      }
    },
    [activeTerminal, terminalCount],
  );

  useEffect(() => {
    return () => {
      terminalRefs.current.forEach((ref, index) => {
        if (index > 0 && ref?.getTerminal) {
          const terminal = ref.getTerminal();

          if (terminal) {
            workbenchStore.detachTerminal(terminal);
          }
        }
      });
    };
  }, []);

  // Removed resize effect

  useEffect(() => {
    // Removed shortcut listener for toggleTerminal
    const unsubscribeFromThemeStore = themeStore.subscribe(() => {
      terminalRefs.current.forEach((ref) => {
        ref?.reloadStyles();
      });
    });

    return () => {
      unsubscribeFromThemeStore();
    };
  }, []);

  return (
    <div className="h-full">
      <div className="bg-bolt-elements-terminals-background h-full flex flex-col">
        <div className="flex items-center bg-bolt-elements-background-depth-2 border-y border-bolt-elements-borderColor gap-1.5 min-h-[34px] p-2">
          {Array.from({ length: terminalCount + 1 }, (_, index) => {
            const isActive = activeTerminal === index;

            return (
              <React.Fragment key={index}>
                {index == 0 ? (
                  <button
                    key={index}
                    className={classNames(
                      'flex items-center text-sm cursor-pointer gap-1.5 px-3 py-2 h-full whitespace-nowrap rounded-full',
                      {
                        'bg-bolt-elements-terminals-buttonBackground text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary':
                          isActive,
                        'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-terminals-buttonBackground':
                          !isActive,
                      },
                    )}
                    onClick={() => setActiveTerminal(index)}
                  >
                    <div className="i-ph:terminal-window-duotone text-lg" />
                    AppForge Terminal
                  </button>
                ) : (
                  <React.Fragment>
                    <button
                      key={index}
                      className={classNames(
                        'flex items-center text-sm cursor-pointer gap-1.5 px-3 py-2 h-full whitespace-nowrap rounded-full',
                        {
                          'bg-bolt-elements-terminals-buttonBackground text-bolt-elements-textPrimary': isActive,
                          'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-terminals-buttonBackground':
                            !isActive,
                        },
                      )}
                      onClick={() => setActiveTerminal(index)}
                    >
                      <div className="i-ph:terminal-window-duotone text-lg" />
                      Terminal {terminalCount > 1 && index}
                      <button
                        className="bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-transparent rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTerminal(index);
                        }}
                      >
                        <div className="i-ph:x text-xs" />
                      </button>
                    </button>
                  </React.Fragment>
                )}
              </React.Fragment>
            );
          })}
          {terminalCount < MAX_TERMINALS && <IconButton icon="i-ph:plus" size="md" onClick={addTerminal} />}
          <IconButton
            icon="i-ph:arrow-clockwise"
            title="Reset Terminal"
            size="md"
            onClick={() => {
              const ref = terminalRefs.current.get(activeTerminal);

              if (ref?.getTerminal()) {
                const terminal = ref.getTerminal()!;
                terminal.clear();
                terminal.focus();

                if (activeTerminal === 0) {
                  workbenchStore.attachBoltTerminal(terminal);
                } else {
                  workbenchStore.attachTerminal(terminal);
                }
              }
            }}
          />
          <IconButton
            className="ml-auto"
            icon="i-ph:caret-down"
            title="Close"
            size="md"
            onClick={() => workbenchStore.toggleTerminal(false)}
          />
        </div>
        {Array.from({ length: terminalCount + 1 }, (_, index) => {
          const isActive = activeTerminal === index;

          logger.debug(`Starting app terminal [${index}]`);

          if (index == 0) {
            return (
              <React.Fragment key={`terminal-container-${index}`}>
                <Terminal
                  key={`terminal-${index}`}
                  id={`terminal_${index}`}
                  className={classNames('h-full overflow-hidden modern-scrollbar-invert', {
                    hidden: !isActive,
                  })}
                  ref={(ref) => {
                    if (ref) {
                      terminalRefs.current.set(index, ref);
                    }
                  }}
                  onTerminalReady={(terminal) => workbenchStore.attachBoltTerminal(terminal)}
                  onTerminalResize={(cols, rows) => workbenchStore.onTerminalResize(cols, rows)}
                  theme={theme}
                />
                <TerminalManager
                  terminal={terminalRefs.current.get(index)?.getTerminal() || null}
                  isActive={isActive}
                />
              </React.Fragment>
            );
          } else {
            return (
              <React.Fragment key={`terminal-container-${index}`}>
                <Terminal
                  key={`terminal-${index}`}
                  id={`terminal_${index}`}
                  className={classNames('modern-scrollbar h-full overflow-hidden', {
                    hidden: !isActive,
                  })}
                  ref={(ref) => {
                    if (ref) {
                      terminalRefs.current.set(index, ref);
                    }
                  }}
                  onTerminalReady={(terminal) => workbenchStore.attachTerminal(terminal)}
                  onTerminalResize={(cols, rows) => workbenchStore.onTerminalResize(cols, rows)}
                  theme={theme}
                />
                <TerminalManager
                  terminal={terminalRefs.current.get(index)?.getTerminal() || null}
                  isActive={isActive}
                />
              </React.Fragment>
            );
          }
        })}
      </div>
    </div>
  );
});
