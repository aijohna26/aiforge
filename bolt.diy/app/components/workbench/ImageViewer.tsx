import React from 'react';

interface ImageViewerProps {
  base64Content: string;
  fileName: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ base64Content, fileName }) => {
  const [hasError, setHasError] = React.useState(false);
  const extension = fileName.split('.').pop()?.toLowerCase();

  // Reset error state when content changes
  React.useEffect(() => {
    setHasError(false);
  }, [base64Content, fileName]);

  let mimeType = 'image/png';

  if (extension === 'jpg' || extension === 'jpeg') {
    mimeType = 'image/jpeg';
  } else if (extension === 'gif') {
    mimeType = 'image/gif';
  } else if (extension === 'svg') {
    mimeType = 'image/svg+xml';
  } else if (extension === 'webp') {
    mimeType = 'image/webp';
  } else if (extension === 'ico') {
    mimeType = 'image/x-icon';
  }

  const src = base64Content ? `data:${mimeType};base64,${base64Content}` : null;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-bolt-elements-background-depth-1 overflow-auto p-4 text-bolt-elements-textPrimary">
      <div className="relative group max-w-full max-h-full flex flex-col items-center gap-4">
        <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg shadow-xl border border-bolt-elements-borderColor flex items-center justify-center min-h-[200px] min-w-[200px]">
          {src && !hasError ? (
            <img
              src={src}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain rounded drop-shadow-md"
              onError={() => setHasError(true)}
            />
          ) : (
            <div className="text-xs text-bolt-elements-textSecondary flex flex-col items-center gap-2 text-center max-w-[150px]">
              <div
                className={`${hasError ? 'i-ph:warning-circle-duotone' : 'i-ph:image-square-duotone'} text-3xl opacity-50`}
              ></div>
              <span>{hasError ? 'Image failed to render' : 'Image file is empty or missing data'}</span>
              <p className="opacity-70 mt-1 italic text-[10px]">
                {hasError
                  ? 'The file might be corrupted or not a valid image format.'
                  : 'Check your terminal for download errors (0 bytes).'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor rounded text-[10px] transition-colors"
              >
                Refresh Editor
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 bg-bolt-elements-background-depth-2 px-4 py-2 rounded-full border border-bolt-elements-borderColor shadow-sm">
          <span className="text-sm font-medium text-bolt-elements-textPrimary">{fileName}</span>
          <span className="text-xs text-bolt-elements-textSecondary uppercase">{extension} Image</span>
        </div>
      </div>
    </div>
  );
};
