import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { themeStore, toggleTheme } from '~/lib/stores/theme';
import { DeployButton } from '~/components/deploy/DeployButton';
import { createClient } from '~/lib/supabase/browser';

interface HeaderActionButtonsProps {
  chatStarted: boolean;
}

export function HeaderActionButtons({ chatStarted: _chatStarted }: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const theme = useStore(themeStore);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const shouldShowButtons = activePreview;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center w-9 h-9 rounded-md border border-bolt-elements-borderColor bg-transparent hover:bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-all group"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <div className="i-ph:sun-bold text-lg group-hover:rotate-90 transition-transform duration-500" />
        ) : (
          <div className="i-ph:moon-bold text-lg group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </button>

      <button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-bolt-elements-borderColor bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 transition-colors">
        <div className="i-ph:git-diff" />
        <span>Show Diff</span>
      </button>

      <button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-bolt-elements-borderColor bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 transition-colors">
        <div className="i-ph:gear" />
        <span>Settings</span>
      </button>

      <button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-bolt-elements-borderColor bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 transition-colors">
        <div className="i-ph:export" />
        <span>Export Code</span>
      </button>

      {/* Deploy Button */}
      <DeployButton />

      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-bolt-elements-borderColor bg-transparent text-bolt-elements-textSecondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
        title="Sign Out"
      >
        <div className="i-ph:sign-out" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
