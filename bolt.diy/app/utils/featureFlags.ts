
export const EXPERIMENTAL_FEATURES = {
    DUBS_WIZARD_MERGE: 'dubs_wizard_merge',
    DUBS_INTERACTIVE_MOCKS: 'dubs_interactive_mocks',
};
export const FEATURES = EXPERIMENTAL_FEATURES;

// Simple local storage based feature toggle for development
// Access this in components to check if the feature is enabled
export const isFeatureEnabled = (featureId: string): boolean => {
    if (typeof window === 'undefined') return false;

    // Enable DUBS_WIZARD_MERGE by default to show the Studio designer
    if (featureId === FEATURES.DUBS_WIZARD_MERGE) {
        return true;
    }

    // Enable DUBS_INTERACTIVE_MOCKS by default to show the interactive canvas on Step 5
    if (featureId === FEATURES.DUBS_INTERACTIVE_MOCKS) {
        return true;
    }

    // For other features, check localStorage
    return localStorage.getItem(`feature_${featureId}`) === 'true';
};

export const toggleFeature = (featureId: string, enabled: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`feature_${featureId}`, String(enabled));
    // Reload to apply changes
    window.location.reload();
}
