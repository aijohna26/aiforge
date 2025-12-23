
export const EXPERIMENTAL_FEATURES = {
    DUBS_WIZARD_MERGE: 'dubs_wizard_merge',
    DUBS_INTERACTIVE_MOCKS: 'dubs_interactive_mocks',
};
export const FEATURES = EXPERIMENTAL_FEATURES;

// Simple local storage based feature toggle for development
// Access this in components to check if the feature is enabled
export const isFeatureEnabled = (featureId: string): boolean => {
    if (typeof window === 'undefined') return false;
    // Enable by default for now to demonstrate the changes, or check localStorage
    // For safety, let's look for the specific key.
    // If you want to enable it by default during development, return true;
    // return true; 
    return localStorage.getItem(`feature_${featureId}`) === 'true';
};

export const toggleFeature = (featureId: string, enabled: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`feature_${featureId}`, String(enabled));
    // Reload to apply changes
    window.location.reload();
}
