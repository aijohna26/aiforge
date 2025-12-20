import { useState, useEffect, useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { useStore } from '@nanostores/react';
import { designWizardStore } from '~/lib/stores/designWizard';
import { DesignCanvas } from './design/DesignCanvas';
import { DesignWizardCanvas } from './design/DesignWizardCanvas';

export function DesignPanel() {
    const wizardData = useStore(designWizardStore);
    const { currentStep } = wizardData;
    const [canvasTransform, setCanvasTransform] = useState({ zoom: 1, panX: 0, panY: 0 });
    const [resetToggle, setResetToggle] = useState<number>(0);

    const handleTransformChange = useCallback((zoom: number, panX: number, panY: number) => {
        setCanvasTransform({ zoom, panX, panY });
    }, []);

    // Trigger canvas reset when step changes
    // Removed to allow zoom/pan to persist across steps
    /* useEffect(() => {
        setResetToggle(Date.now());
    }, [currentStep]); */

    return (
        <div className="relative w-full h-full overflow-hidden">
            <ClientOnly>
                {() => (
                    <>
                        <DesignCanvas onTransformChange={handleTransformChange} forceReset={resetToggle} />
                        <DesignWizardCanvas
                            zoom={canvasTransform.zoom}
                            panX={canvasTransform.panX}
                            panY={canvasTransform.panY}
                            onRecenter={() => setResetToggle(Date.now())}
                        />
                    </>
                )}
            </ClientOnly>
        </div>
    );
}
