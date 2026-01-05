import { describe, it, expect, beforeEach, vi } from 'vitest';
import { designWizardStore, loadWizardData, updateStep5Data, enableAutoSaveAfterHydration } from '../designWizard';

describe('Studio Persistence - Regression Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    designWizardStore.set({
      currentStep: 1,
      projectName: '',
      step5: undefined,
    });
  });

  describe('loadWizardData - Frame Count Protection', () => {
    it('should NOT overwrite 32 frames with 6 frames from project data after hydration', () => {
      // Simulate Studio having loaded 32 frames from DB
      updateStep5Data({
        studioFrames: Array(32).fill(null).map((_, i) => ({
          id: `frame-${i}`,
          x: i * 100,
          y: 0
        })),
      });

      // Mark hydration as complete (this is what protects the data)
      enableAutoSaveAfterHydration();

      const currentState = designWizardStore.get();
      expect(currentState.step5?.studioFrames).toHaveLength(32);

      // Simulate Chat loading stale project data with 6 frames
      loadWizardData({
        currentStep: 1,
        projectName: 'Test',
        step5: {
          studioFrames: Array(6).fill(null).map((_, i) => ({
            id: `old-frame-${i}`,
            x: i * 100,
            y: 0
          })),
        },
      });

      // CRITICAL: Should preserve 32 frames because hydration completed
      const finalState = designWizardStore.get();
      expect(finalState.step5?.studioFrames).toHaveLength(32);
      expect(finalState.step5?.studioFrames?.[0].id).toBe('frame-0'); // Original frames
    });

    it('should NOT restore deleted frames from stale project data', () => {
      // User starts with 32 frames
      updateStep5Data({
        studioFrames: Array(32).fill(null).map((_, i) => ({
          id: `frame-${i}`,
          x: i * 100,
          y: 0
        })),
      });

      // Hydration completes
      enableAutoSaveAfterHydration();

      // User deletes 10 frames (32 -> 22)
      updateStep5Data({
        studioFrames: Array(22).fill(null).map((_, i) => ({
          id: `frame-${i}`,
          x: i * 100,
          y: 0
        })),
      });

      expect(designWizardStore.get().step5?.studioFrames).toHaveLength(22);

      // Chat loads stale project data with 32 frames (before deletion)
      loadWizardData({
        currentStep: 1,
        projectName: 'Test',
        step5: {
          studioFrames: Array(32).fill(null).map((_, i) => ({
            id: `old-frame-${i}`,
            x: i * 100,
            y: 0
          })),
        },
      });

      // CRITICAL: Should preserve 22 frames (user's deletion)
      // NOT restore to 32 frames from stale project data
      const finalState = designWizardStore.get();
      expect(finalState.step5?.studioFrames).toHaveLength(22);
    });

    it('should allow project data before hydration completes', () => {
      // Before hydration (canAutoSave = false)
      // Start with empty state

      // Load project data with 32 frames
      loadWizardData({
        currentStep: 1,
        projectName: 'Test',
        step5: {
          studioFrames: Array(32).fill(null).map((_, i) => ({
            id: `project-frame-${i}`,
            x: i * 100,
            y: 0
          })),
        },
      });

      // Should accept 32 frames since hydration hasn't completed
      const finalState = designWizardStore.get();
      expect(finalState.step5?.studioFrames).toHaveLength(32);
      expect(finalState.step5?.studioFrames?.[0].id).toBe('project-frame-0');
    });

    it('should prefer more frames when hydration has not completed', () => {
      // Load 6 frames from project data (before hydration)
      loadWizardData({
        currentStep: 1,
        projectName: 'Test',
        step5: {
          studioFrames: Array(6).fill(null).map((_, i) => ({
            id: `frame-${i}`,
            x: i * 100,
            y: 0
          })),
        },
      });

      expect(designWizardStore.get().step5?.studioFrames).toHaveLength(6);

      // Load 32 frames from another source (still before hydration)
      loadWizardData({
        currentStep: 1,
        projectName: 'Test',
        step5: {
          studioFrames: Array(32).fill(null).map((_, i) => ({
            id: `new-frame-${i}`,
            x: i * 100,
            y: 0
          })),
        },
      });

      // Should upgrade to 32 frames (more data)
      const finalState = designWizardStore.get();
      expect(finalState.step5?.studioFrames).toHaveLength(32);
      expect(finalState.step5?.studioFrames?.[0].id).toBe('new-frame-0');
    });

    it('should preserve other wizard data while protecting Step 5', () => {
      // Setup current state with 32 frames
      updateStep5Data({
        studioFrames: Array(32).fill(null).map((_, i) => ({
          id: `frame-${i}`,
          x: i * 100,
          y: 0
        })),
      });

      enableAutoSaveAfterHydration();

      // Load project data with different wizard data
      loadWizardData({
        currentStep: 5,
        projectName: 'Updated Project Name',
        step5: {
          studioFrames: Array(6).fill(null).map((_, i) => ({
            id: `old-frame-${i}`,
            x: i * 100,
            y: 0
          })),
        },
      });

      const finalState = designWizardStore.get();

      // Step 5 frames should be preserved
      expect(finalState.step5?.studioFrames).toHaveLength(32);

      // Other wizard data should be updated
      expect(finalState.projectName).toBe('Updated Project Name');
      expect(finalState.currentStep).toBe(5);
    });
  });
});
