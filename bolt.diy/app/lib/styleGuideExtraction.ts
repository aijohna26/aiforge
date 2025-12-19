import { toast } from 'sonner';
import { designWizardStore, updateStep3Data } from '~/lib/stores/designWizard';

interface ExtractionResponse {
    success: boolean;
    palettes?: any[];
    typography?: any[];
    styles?: any[];
    error?: string;
}

export async function extractStyleGuideFromMoodboard(referenceImages: string[]) {
    if (!referenceImages.length) {
        toast.error('Add at least one inspiration image before continuing.');
        return;
    }

    updateStep3Data({
        extractionStatus: 'extracting',
        extractionError: undefined,
    });

    try {
        const response = await fetch('/api/style-guide/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: referenceImages }),
        });

        const data: ExtractionResponse = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to analyze mood board');
        }

        updateStep3Data({
            paletteOptions: data.palettes || [],
            typographyOptions: data.typography || [],
            styleDirections: data.styles || [],
            extractionStatus: 'complete',
            extractionError: undefined,
            lastExtractedAt: new Date().toISOString(),
            selectedPaletteId: null,
            selectedTypographyId: null,
            selectedStyleId: null,
            colorPalette: null,
            typography: null,
            entryMode: 'ai',
        });
    } catch (error: any) {
        console.error('[StyleGuideExtraction] failed', error);
        updateStep3Data({
            extractionStatus: 'error',
            extractionError: error.message || 'Failed to analyze mood board',
        });
        toast.error(error.message || 'Failed to analyze mood board');
        throw error;
    }
}

export function hasExtractedStyleGuide() {
    const { step3 } = designWizardStore.get();
    return step3.extractionStatus === 'complete' && step3.paletteOptions.length > 0;
}
