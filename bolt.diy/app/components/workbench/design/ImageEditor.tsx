import React, { useState, useRef, useEffect, useCallback } from 'react';
import { removeBackground } from '@imgly/background-removal';

interface ImageEditorProps {
    imageUrl: string;
    onSave: (editedImageUrl: string) => void;
    onCancel: () => void;
}

type Tool = 'none' | 'crop' | 'background-removal';

interface CropState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
    const [activeTool, setActiveTool] = useState<Tool>('none');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Crop state
    const [cropState, setCropState] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [canvasScale, setCanvasScale] = useState(1);

    // Load image on mount
    useEffect(() => {
        const loadImage = async () => {
            try {
                // If it's a data URL or blob, load directly
                if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
                    const img = new Image();
                    img.onload = () => {
                        setOriginalImage(img);
                        setCurrentImage(img);
                        drawImageOnCanvas(img);
                    };
                    img.onerror = () => {
                        setError('Failed to load image');
                    };
                    img.src = imageUrl;
                } else {
                    // For regular URLs (including proxy URLs), fetch as blob first to avoid CORS issues
                    const response = await fetch(imageUrl);
                    if (!response.ok) throw new Error('Failed to fetch image');

                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);

                    const img = new Image();
                    img.onload = () => {
                        setOriginalImage(img);
                        setCurrentImage(img);
                        drawImageOnCanvas(img);
                        URL.revokeObjectURL(blobUrl);
                    };
                    img.onerror = () => {
                        setError('Failed to load image');
                        URL.revokeObjectURL(blobUrl);
                    };
                    img.src = blobUrl;
                }
            } catch (err) {
                console.error('Image loading error:', err);
                setError('Failed to load image');
            }
        };

        loadImage();
    }, [imageUrl]);

    const drawImageOnCanvas = useCallback((img: HTMLImageElement, cropRect?: CropState) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match container (max 800x600)
        const maxWidth = 800;
        const maxHeight = 600;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        setCanvasScale(scale);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw crop overlay if crop tool is active
        if (activeTool === 'crop' && cropRect && cropRect.width > 0 && cropRect.height > 0) {
            // Darken everything outside crop area
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, cropRect.y);
            ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.height);
            ctx.fillRect(cropRect.x + cropRect.width, cropRect.y, canvas.width - (cropRect.x + cropRect.width), cropRect.height);
            ctx.fillRect(0, cropRect.y + cropRect.height, canvas.width, canvas.height - (cropRect.y + cropRect.height));

            // Draw crop box border
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);

            // Draw corner handles
            const handleSize = 10;
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(cropRect.x - handleSize/2, cropRect.y - handleSize/2, handleSize, handleSize);
            ctx.fillRect(cropRect.x + cropRect.width - handleSize/2, cropRect.y - handleSize/2, handleSize, handleSize);
            ctx.fillRect(cropRect.x - handleSize/2, cropRect.y + cropRect.height - handleSize/2, handleSize, handleSize);
            ctx.fillRect(cropRect.x + cropRect.width - handleSize/2, cropRect.y + cropRect.height - handleSize/2, handleSize, handleSize);
        }
    }, [activeTool]);

    useEffect(() => {
        if (currentImage) {
            drawImageOnCanvas(currentImage, cropState);
        }
    }, [currentImage, cropState, drawImageOnCanvas]);

    const handleRemoveBackground = async () => {
        if (!currentImage) return;

        setIsProcessing(true);
        setError(null);
        try {
            // Convert current image to blob first
            const canvas = document.createElement('canvas');
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');

            ctx.drawImage(currentImage, 0, 0);

            // Convert canvas to blob
            const imageBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to convert canvas to blob'));
                }, 'image/png');
            });

            // Remove background using @imgly/background-removal
            const blob = await removeBackground(imageBlob, {
                progress: (key, current, total) => {
                    console.log(`Background removal progress: ${key} ${current}/${total}`);
                }
            });

            // Convert blob to image
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                setCurrentImage(img);
                setIsProcessing(false);
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                setError('Failed to load processed image');
                setIsProcessing(false);
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } catch (err) {
            console.error('Background removal failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove background. Please try again.');
            setIsProcessing(false);
        }
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (activeTool !== 'crop' || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDragging(true);
        setDragStart({ x, y });
        setCropState({ x, y, width: 0, height: 0 });
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || activeTool !== 'crop' || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const width = x - dragStart.x;
        const height = y - dragStart.y;

        setCropState({
            x: width < 0 ? x : dragStart.x,
            y: height < 0 ? y : dragStart.y,
            width: Math.abs(width),
            height: Math.abs(height),
        });
    };

    const handleCanvasMouseUp = () => {
        setIsDragging(false);
    };

    const handleApplyCrop = () => {
        if (!currentImage || !canvasRef.current || cropState.width === 0 || cropState.height === 0) return;

        const canvas = canvasRef.current;
        const scale = canvasScale;

        // Create a new canvas for the cropped image
        const croppedCanvas = document.createElement('canvas');
        const ctx = croppedCanvas.getContext('2d');
        if (!ctx) return;

        // Calculate actual crop coordinates (unscale)
        const actualX = cropState.x / scale;
        const actualY = cropState.y / scale;
        const actualWidth = cropState.width / scale;
        const actualHeight = cropState.height / scale;

        croppedCanvas.width = actualWidth;
        croppedCanvas.height = actualHeight;

        // Draw cropped portion
        ctx.drawImage(
            currentImage,
            actualX, actualY, actualWidth, actualHeight,
            0, 0, actualWidth, actualHeight
        );

        // Convert to image
        const img = new Image();
        img.onload = () => {
            setCurrentImage(img);
            setCropState({ x: 0, y: 0, width: 0, height: 0 });
            setActiveTool('none');
        };
        img.src = croppedCanvas.toDataURL('image/png');
    };

    const handleSave = async () => {
        if (!canvasRef.current || !currentImage) return;

        setIsUploading(true);
        setError(null);

        try {
            // Create a final canvas with the current image
            const finalCanvas = document.createElement('canvas');
            const ctx = finalCanvas.getContext('2d');
            if (!ctx) {
                throw new Error('Failed to get canvas context');
            }

            finalCanvas.width = currentImage.width;
            finalCanvas.height = currentImage.height;
            ctx.drawImage(currentImage, 0, 0);

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                finalCanvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to convert canvas to blob'));
                }, 'image/png');
            });

            // Upload the blob to our API endpoint
            const formData = new FormData();
            formData.append('image', blob, 'edited-image.png');

            const uploadResponse = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || 'Failed to upload image');
            }

            const uploadData = await uploadResponse.json();

            if (!uploadData.success || !uploadData.url) {
                throw new Error('Upload did not return a valid URL');
            }

            // Call onSave with the HTTP URL instead of data URL
            onSave(uploadData.url);
        } catch (err) {
            console.error('Image save/upload failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to save image. Please try again.');
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10002] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0b0c14] border border-[#1F243B] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[#1F243B]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Edit Image</h2>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-[#171C2D] rounded-lg transition-colors"
                            disabled={isProcessing || isUploading}
                        >
                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-[#1F243B] bg-[#0D1117]">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setActiveTool('crop');
                                setCropState({ x: 0, y: 0, width: 0, height: 0 });
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                activeTool === 'crop'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-[#171C2D] text-slate-300 hover:bg-[#1F243B]'
                            }`}
                            disabled={isProcessing || isUploading}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10M7 7V3M7 7H3m14 14h-4m0 0v-4m0 4H7" />
                                </svg>
                                Crop
                            </div>
                        </button>

                        {activeTool === 'crop' && cropState.width > 0 && (
                            <button
                                onClick={handleApplyCrop}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                disabled={isUploading}
                            >
                                Apply Crop
                            </button>
                        )}

                        <button
                            onClick={handleRemoveBackground}
                            disabled={isProcessing || isUploading}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                isProcessing || isUploading
                                    ? 'bg-[#171C2D] text-slate-500 cursor-not-allowed'
                                    : 'bg-[#171C2D] text-slate-300 hover:bg-[#1F243B]'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {isProcessing ? 'Removing...' : 'Remove Background'}
                            </div>
                        </button>

                        {activeTool !== 'none' && (
                            <button
                                onClick={() => {
                                    setActiveTool('none');
                                    setCropState({ x: 0, y: 0, width: 0, height: 0 });
                                }}
                                className="px-4 py-2 bg-[#171C2D] text-slate-300 hover:bg-[#1F243B] rounded-lg font-medium transition-colors"
                                disabled={isUploading}
                            >
                                Cancel Tool
                            </button>
                        )}
                    </div>

                    {activeTool === 'crop' && (
                        <p className="text-sm text-slate-400 mt-2">
                            Click and drag on the image to select the area you want to keep
                        </p>
                    )}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[#0D1117]">
                    {error && (
                        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                        className={`border border-[#2F344B] rounded-lg ${
                            activeTool === 'crop' ? 'cursor-crosshair' : ''
                        }`}
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#1F243B] flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-[#171C2D] hover:bg-[#1F243B] text-white rounded-lg font-medium transition-colors"
                        disabled={isProcessing || isUploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isProcessing || isUploading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </div>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
