import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { DesignCanvas } from './design/DesignCanvas';
import { DesignWizardCanvas } from './design/DesignWizardCanvas';

export function DesignPanel() {
    const [canvasTransform, setCanvasTransform] = useState({ zoom: 1, panX: 0, panY: 0 });

    const handleTransformChange = (zoom: number, panX: number, panY: number) => {
        setCanvasTransform({ zoom, panX, panY });
    };

    return (
        <div className="relative w-full h-full overflow-hidden">
            <ClientOnly>
                {() => (
                    <>
                        <DesignCanvas onTransformChange={handleTransformChange} />
                        <DesignWizardCanvas
                            zoom={canvasTransform.zoom}
                            panX={canvasTransform.panX}
                            panY={canvasTransform.panY}
                        />
                    </>
                )}
            </ClientOnly>
        </div>
    );
}
