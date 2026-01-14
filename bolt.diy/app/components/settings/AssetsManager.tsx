import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { createPortal } from 'react-dom';
import { AssetGenerator } from '~/components/assets/AssetGenerator';

export const AssetsManager = () => {
    const files = useStore(workbenchStore.files);
    const [search, setSearch] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    const assets = useMemo(() => {
        return Object.entries(files)
            .filter(([path, dirent]) => {
                return (path.startsWith('assets/') || path.startsWith('public/')) && dirent?.type === 'file' && !path.endsWith('.DS_Store');
            })
            .map(([path, dirent]) => {
                const isFile = dirent?.type === 'file';
                return {
                    path,
                    name: path.split('/').pop() || '',
                    content: isFile ? (dirent as any).content : undefined,
                    isBinary: isFile ? (dirent as any).isBinary : false
                };
            });
    }, [files]);

    const filteredAssets = useMemo(() => {
        if (!search) return assets;
        return assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    }, [assets, search]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        setIsUploading(true);
        try {
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                // Determine target path (default to assets/images)
                const targetPath = `assets/images/${file.name}`;

                await workbenchStore.createFile(targetPath, uint8Array);
                toast.success(`Uploaded ${file.name}`);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to upload files');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleSaveGeneratedAsset = async (url: string, prompt: string) => {
        const toastId = toast.loading('Saving asset...');
        try {
            // Fetch the image
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to download generated image');

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Generate filename based on prompt or timestamp
            const slug = prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase();
            const filename = `generated-${slug}-${Date.now()}.png`;
            const targetPath = `assets/generated/${filename}`;

            await workbenchStore.createFile(targetPath, uint8Array);

            toast.update(toastId, { render: 'Asset saved successfully', type: 'success', isLoading: false, autoClose: 3000 });
            setShowGenerateModal(false);
        } catch (err) {
            console.error(err);
            toast.update(toastId, { render: 'Failed to save asset', type: 'error', isLoading: false, autoClose: 3000 });
        }
    };

    const getMimeType = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'svg') return 'image/svg+xml';
        if (ext === 'png') return 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
        if (ext === 'webp') return 'image/webp';
        if (ext === 'gif') return 'image/gif';
        return 'application/octet-stream';
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header / Toolbar */}
            <div className="p-6 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                <div className="flex flex-col gap-4 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Assets Library</h2>
                            <p className="text-sm text-bolt-elements-textSecondary">Manage your project's images, icons, and media files.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                className="px-4 py-2 rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary text-sm font-medium transition-colors flex items-center gap-2"
                                onClick={() => setShowGenerateModal(true)}
                            >
                                <div className="i-ph:magic-wand text-purple-400" />
                                Generate Assets
                            </button>
                            <label className={`px-4 py-2 rounded-lg bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                {isUploading ? <div className="i-ph:spinner animate-spin" /> : <div className="i-ph:upload-simple" />}
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </label>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <div className="i-ph:magnifying-glass text-bolt-elements-textTertiary" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
                        />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-bolt-elements-background-depth-2">
                <div className="max-w-5xl mx-auto">
                    {filteredAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-bolt-elements-textTertiary">
                            <div className="i-ph:images text-6xl mb-4 opacity-20" />
                            <p className="text-lg font-medium">No assets found</p>
                            <p className="text-sm mt-2">Upload images to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredAssets.map((asset) => (
                                <div key={asset.path} className="group relative bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-xl overflow-hidden hover:border-bolt-elements-borderColorActive transition-all hover:shadow-lg">
                                    <div className="aspect-square relative bg-bolt-elements-background-depth-3 flex items-center justify-center overflow-hidden">
                                        {/* Image Preview */}
                                        {asset.isBinary && asset.content ? (
                                            <img
                                                src={`data:${getMimeType(asset.name)};base64,${asset.content}`}
                                                alt={asset.name}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="i-ph:file-image text-4xl text-bolt-elements-textTertiary" />
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`require("../${asset.path}")`);
                                                    toast.success('Copied import path!');
                                                }}
                                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md"
                                                title="Copy Import Path"
                                            >
                                                <div className="i-ph:code" />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`Delete ${asset.name}?`)) {
                                                        await workbenchStore.deleteFile(asset.path);
                                                        toast.success('Deleted asset');
                                                    }
                                                }}
                                                className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-md"
                                                title="Delete"
                                            >
                                                <div className="i-ph:trash" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <p className="text-sm font-medium text-bolt-elements-textPrimary truncate" title={asset.name}>
                                            {asset.name}
                                        </p>
                                        <p className="text-xs text-bolt-elements-textTertiary truncate mt-0.5">
                                            {asset.path}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Generate Assets Modal */}
            {showGenerateModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-xl p-6 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-bolt-elements-textPrimary">Generate Assets</h3>
                                <p className="text-sm text-bolt-elements-textSecondary">Use AI to create icons, illustrations, and images.</p>
                            </div>
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-colors"
                            >
                                <div className="i-ph:x text-2xl" />
                            </button>
                        </div>

                        <AssetGenerator
                            onSelect={handleSaveGeneratedAsset}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
