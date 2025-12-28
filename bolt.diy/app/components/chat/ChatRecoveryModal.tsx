import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { openDatabase, getAll, type ChatHistoryItem } from '~/lib/persistence/db';
import { formatDistanceToNow } from 'date-fns';

interface ChatRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatRecoveryModal({ isOpen, onClose }: ChatRecoveryModalProps) {
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const db = await openDatabase();
      if (db) {
        const allChats = await getAll(db);
        // Sort by timestamp (most recent first)
        allChats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setChats(allChats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const searchLower = searchTerm.toLowerCase();
    const descMatch = chat.description?.toLowerCase().includes(searchLower);

    const messageMatch = chat.messages.some((msg) => {
      const content = typeof msg.content === 'string' ? msg.content.toLowerCase() : '';
      return content.includes(searchLower);
    });

    return descMatch || messageMatch;
  });

  const handleChatClick = (chat: ChatHistoryItem) => {
    const chatUrl = `/chat/${chat.urlId || chat.id}`;
    window.location.href = chatUrl;
    onClose();
  };

  const getFirstUserMessage = (chat: ChatHistoryItem) => {
    const firstUserMsg = chat.messages.find((m) => m.role === 'user');
    if (firstUserMsg) {
      const content = typeof firstUserMsg.content === 'string'
        ? firstUserMsg.content
        : JSON.stringify(firstUserMsg.content);
      return content.substring(0, 150) + (content.length > 150 ? '...' : '');
    }
    return 'No messages';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[9999]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-bolt-elements-background-depth-1 rounded-lg shadow-xl border border-bolt-elements-borderColor">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-bolt-elements-borderColor">
            <div>
              <Dialog.Title className="text-xl font-semibold text-bolt-elements-textPrimary">
                Recover Chat
              </Dialog.Title>
              <p className="text-sm text-bolt-elements-textSecondary mt-1">
                Found {chats.length} saved chat{chats.length !== 1 ? 's' : ''} in your browser
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
            >
              <div className="i-ph:x text-2xl" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-bolt-elements-borderColor">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <div className="i-ph:magnifying-glass text-bolt-elements-textSecondary" />
              </div>
              <input
                type="text"
                placeholder="Search chats by description or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="max-h-[500px] overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="i-ph:spinner text-4xl text-bolt-elements-loader-progress animate-spin" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <div className="i-ph:chat-circle-dots text-6xl text-bolt-elements-textTertiary mb-4 mx-auto" />
                <p className="text-bolt-elements-textSecondary">
                  {searchTerm ? 'No chats match your search' : 'No saved chats found'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleChatClick(chat)}
                    className="w-full text-left p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 hover:border-bolt-elements-focus transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-bolt-elements-textPrimary mb-1 truncate group-hover:text-bolt-elements-focus transition-colors">
                          {chat.description || 'Untitled Chat'}
                        </h3>
                        <p className="text-sm text-bolt-elements-textSecondary line-clamp-2 mb-2">
                          {getFirstUserMessage(chat)}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-bolt-elements-textTertiary">
                          <span className="flex items-center gap-1">
                            <div className="i-ph:clock" />
                            {formatDistanceToNow(new Date(chat.timestamp), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="i-ph:chat-circle-text" />
                            {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="i-ph:arrow-right text-xl text-bolt-elements-focus" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
            <p className="text-xs text-bolt-elements-textTertiary">
              Chats are stored locally in your browser's IndexedDB. Click any chat above to restore it.
            </p>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
