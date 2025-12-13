import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { DeployButton } from '~/components/deploy/DeployButton';

interface HeaderActionButtonsProps {
  chatStarted: boolean;
}

export function HeaderActionButtons({ chatStarted: _chatStarted }: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const shouldShowButtons = activePreview;

  return (
    <div className="flex items-center gap-2">
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 transition-colors"
      >
        <div className="i-ph:git-diff" />
        <span>Show Diff</span>
      </button>

      <button
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 transition-colors"
      >
        <div className="i-ph:gear" />
        <span>Settings</span>
      </button>

      <button
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 transition-colors"
      >
        <div className="i-ph:export" />
        <span>Export Code</span>
      </button>

      {/* Deploy Button */}
      <DeployButton />
    </div>
  );
}
