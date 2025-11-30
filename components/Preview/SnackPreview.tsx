"use client";

import { useEffect, useRef, useState } from "react";
import type { GeneratedProject } from "@/lib/types";

interface SnackPreviewProps {
  project: GeneratedProject;
  platform?: "web" | "ios" | "android";
  showEditor?: boolean;
}

export function SnackPreview({ project, platform = "web", showEditor = false }: SnackPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedReady, setEmbedReady] = useState(false);

  useEffect(() => {
    // Load Expo Snack embed script if not already loaded
    if (!document.getElementById('expo-snack-embed')) {
      const script = document.createElement('script');
      script.id = 'expo-snack-embed';
      script.src = 'https://snack.expo.dev/embed.js';
      script.async = true;
      script.onload = () => setEmbedReady(true);
      document.head.appendChild(script);
    } else {
      setEmbedReady(true);
    }
  }, []);

  useEffect(() => {
    if (!embedReady || !containerRef.current || !project) return;

    // Find the main app file
    const mainFile = project.files?.find(
      (f) =>
        f.path === "app/index.tsx" ||
        f.path === "App.tsx" ||
        f.path === "App.js"
    );

    if (!mainFile) return;

    // Create unique key for this project version (to force re-render on content change)
    const contentHash = `${project.projectName}-${mainFile.content.length}-${Date.now()}`;

    // Create Snack embed div
    const snackDiv = document.createElement('div');

    // Set Snack configuration as data attributes
    snackDiv.setAttribute('data-snack-code', mainFile.content);
    snackDiv.setAttribute('data-snack-name', project.projectName);
    snackDiv.setAttribute('data-snack-description', project.description || '');
    snackDiv.setAttribute('data-snack-platform', platform);
    snackDiv.setAttribute('data-snack-preview', showEditor ? 'false' : 'true'); // Hide editor in device frame
    snackDiv.setAttribute('data-snack-theme', 'dark');
    snackDiv.setAttribute('data-snack-loading', 'eager');
    snackDiv.setAttribute('data-snack-sdk-version', '51.0.0'); // Latest stable Expo SDK

    // Extract dependencies from package.json if available
    const packageJson = project.files?.find(f => f.path === 'package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson.content);
        const deps = Object.keys(pkg.dependencies || {})
          .filter(dep => !dep.startsWith('@types/'))
          .join(',');
        if (deps) {
          snackDiv.setAttribute('data-snack-dependencies', deps);
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Style the container
    snackDiv.style.overflow = 'hidden';
    snackDiv.style.background = '#0a0e27';
    snackDiv.style.border = '1px solid rgba(255,255,255,0.1)';
    snackDiv.style.borderRadius = '12px';
    snackDiv.style.height = '100%';
    snackDiv.style.width = '100%';

    // Clear container and append new embed
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(snackDiv);

    // Trigger embed.js to process the new div
    if (window.ExpoSnack) {
      window.ExpoSnack.append(snackDiv);
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [embedReady, project, project?.files]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: '500px' }}
    />
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ExpoSnack?: {
      append: (element: HTMLElement) => void;
      remove: (element: HTMLElement) => void;
    };
  }
}
