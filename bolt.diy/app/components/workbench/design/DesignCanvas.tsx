import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, util, Point } from 'fabric';

interface DesignCanvasProps {
    className?: string;
    onTransformChange?: (zoom: number, panX: number, panY: number) => void;
}

export const DesignCanvas = ({ className, onTransformChange }: DesignCanvasProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    // Notify parent of transform changes
    const notifyTransformChange = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !onTransformChange) return;

        const vpt = canvas.viewportTransform;
        if (vpt) {
            onTransformChange(canvas.getZoom(), vpt[4], vpt[5]);
        }
    }, [onTransformChange]);

    const handleZoom = useCallback((direction: 'in' | 'out') => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        let zoom = canvas.getZoom();
        const zoomStep = 0.1;

        if (direction === 'in') {
            zoom = Math.min(zoom + zoomStep, 2); // Max 200%
        } else {
            zoom = Math.max(zoom - zoomStep, 0.1); // Min 10%
        }

        // Zoom to the center of the canvas
        const center = new Point(canvas.width! / 2, canvas.height! / 2);
        canvas.zoomToPoint(center, zoom);
        canvas.renderAll();
        setZoomLevel(Math.round(zoom * 100));
        notifyTransformChange();
    }, [notifyTransformChange]);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        // Initialize fabric canvas
        const canvas = new Canvas(canvasRef.current, {
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: '#0a0a0a',
            selection: true,
            fireRightClick: true, // Enable right click events
            stopContextMenu: true, // Prevent context menu
        });

        fabricCanvasRef.current = canvas;

        // --- Grid Implementation ---
        const gridSize = 50;
        const gridColor = '#333';

        // We override the render method to draw a grid using HTML5 Canvas API for performance
        // This is more efficient than adding thousands of line objects
        const originalRender = canvas.renderCanvas.bind(canvas);
        canvas.renderCanvas = function (ctx, objects) {
            const vpt = this.viewportTransform;
            const zoom = this.getZoom();

            // Clear background
            ctx.fillStyle = this.backgroundColor as string;
            ctx.fillRect(0, 0, this.width, this.height);

            // Draw Grid
            ctx.save();
            if (vpt) {
                ctx.translate(vpt[4], vpt[5]);
                ctx.scale(zoom, zoom);

                const width = this.width / zoom;
                const height = this.height / zoom;
                const offX = -vpt[4] / zoom;
                const offY = -vpt[5] / zoom;

                ctx.lineWidth = 1 / zoom;
                ctx.strokeStyle = gridColor;

                const startX = Math.floor(offX / gridSize) * gridSize;
                const startY = Math.floor(offY / gridSize) * gridSize;

                ctx.beginPath();
                // Vertical lines
                for (let x = startX; x < offX + width; x += gridSize) {
                    ctx.moveTo(x, offY);
                    ctx.lineTo(x, offY + height);
                }
                // Horizontal lines
                for (let y = startY; y < offY + height; y += gridSize) {
                    ctx.moveTo(offX, y);
                    ctx.lineTo(offX + width, y);
                }
                ctx.stroke();
            }
            ctx.restore();

            // Call original render to draw objects on top
            originalRender(ctx, objects);
        };

        // --- Infinite Canvas Controls (Figma-like) ---

        // Zoom: Ctrl + Wheel
        // Pan: Wheel (Vertical), Shift + Wheel (Horizontal)
        canvas.on('mouse:wheel', (opt: any) => {
            const evt = opt.e;
            evt.preventDefault();
            evt.stopPropagation();

            if (evt.ctrlKey || evt.metaKey) {
                // Zooming
                const delta = evt.deltaY;
                let zoom = canvas.getZoom();
                zoom *= 0.999 ** delta;
                if (zoom > 2) zoom = 2;
                if (zoom < 0.1) zoom = 0.1;
                canvas.zoomToPoint(new Point(evt.offsetX, evt.offsetY), zoom);
                setZoomLevel(Math.round(zoom * 100));
                notifyTransformChange();
            } else {
                // Panning
                const vpt = canvas.viewportTransform;
                if (!vpt) return;

                // Pan Horizontal with Shift, Vertical otherwise
                // Note: Some mice have horizontal scroll which is deltaX
                if (evt.shiftKey) {
                    vpt[4] -= evt.deltaY;
                } else {
                    vpt[4] -= evt.deltaX;
                    vpt[5] -= evt.deltaY;
                }
                canvas.requestRenderAll();
                notifyTransformChange();
            }
        });

        // Panning with Space + Drag or Middle Click
        let isDragging = false;
        let lastPosX = 0;
        let lastPosY = 0;
        let isSpacePressed = false;

        // We need to attach keydown to window because canvas might not have focus initially
        // But better to attach to document or window and check if hovering canvas? 
        // For simplicity, we'll try tracking space key globally but only act if dragging on canvas.
        // Actually, fabric can handle this if we set `canvas.selection` dynamically.

        canvas.on('mouse:down', (opt: any) => {
            const evt = opt.e;
            // Middle Button (button 1) or Space Key (handled via isSpacePressed check)
            if (evt.button === 1 || isSpacePressed) {
                isDragging = true;
                canvas.selection = false;
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
                canvas.setCursor('grab');
            }
        });

        canvas.on('mouse:move', (opt: any) => {
            if (isDragging) {
                const e = opt.e;
                const vpt = canvas.viewportTransform;
                if (!vpt) return;

                vpt[4] += e.clientX - lastPosX;
                vpt[5] += e.clientY - lastPosY;
                canvas.requestRenderAll();
                lastPosX = e.clientX;
                lastPosY = e.clientY;
                notifyTransformChange();
            }
        });

        canvas.on('mouse:up', () => {
            if (isDragging) {
                canvas.setViewportTransform(canvas.viewportTransform);
                isDragging = false;
                canvas.selection = true; // Re-enable selection
                canvas.setCursor('default');
                notifyTransformChange();
            }
        });

        // Keyboard event listeners for Space Key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !isSpacePressed && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                isSpacePressed = true;
                canvas.selection = false; // Disable selection while holding space
                canvas.defaultCursor = 'grab';
                canvas.setCursor('grab');
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                isSpacePressed = false;
                if (!isDragging) {
                    canvas.selection = true;
                    canvas.defaultCursor = 'default';
                    canvas.setCursor('default');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            canvas.dispose();
        };
    }, []);

    // Handle Resize
    useEffect(() => {
        if (!containerRef.current) return;

        const resize = () => {
            if (fabricCanvasRef.current && containerRef.current) {
                fabricCanvasRef.current.setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        const resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-bolt-elements-background-depth-1">
            <canvas ref={canvasRef} />

            {/* Controls Info */}
            <div className="absolute top-4 left-4 text-xs text-bolt-elements-textTertiary pointer-events-none select-none z-50 bg-bolt-elements-background-depth-2/80 p-2 rounded backdrop-blur-sm border border-bolt-elements-borderColor">
                <p><span className="font-bold text-bolt-elements-textPrimary">Controls:</span></p>
                <p>Wheel: Pan</p>
                <p>Ctrl + Wheel: Zoom</p>
                <p>Space + Drag: Pan</p>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                {/* Zoom Out Button */}
                <button
                    onClick={() => handleZoom('out')}
                    className="w-8 h-8 flex items-center justify-center bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded text-bolt-elements-textPrimary transition-colors"
                    title="Zoom Out"
                >
                    <div className="i-ph:minus text-lg" />
                </button>

                {/* Zoom Level Display */}
                <div className="px-3 py-1 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded text-xs text-bolt-elements-textPrimary font-mono">
                    {zoomLevel}%
                </div>

                {/* Zoom In Button */}
                <button
                    onClick={() => handleZoom('in')}
                    className="w-8 h-8 flex items-center justify-center bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded text-bolt-elements-textPrimary transition-colors"
                    title="Zoom In"
                >
                    <div className="i-ph:plus text-lg" />
                </button>
            </div>
        </div>
    );
};
