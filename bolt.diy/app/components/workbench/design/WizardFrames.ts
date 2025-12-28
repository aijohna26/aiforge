import { Canvas, Group, Rect, Text } from 'fabric';

export interface WizardStep1Data {
  appName: string;
  tagline: string;
  category: string;
  targetAudience: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function createWizardStep1Frame(canvas: Canvas): Group {
  const frameWidth = 600;
  const frameHeight = 700;
  const framePadding = 40;

  // Background
  const background = new Rect({
    width: frameWidth,
    height: frameHeight,
    fill: '#1a1a1a',
    stroke: '#333',
    strokeWidth: 2,
    rx: 12,
    ry: 12,
  });

  // Title
  const title = new Text('Step 1: App Information', {
    fontSize: 24,
    fontWeight: 'bold',
    fill: '#ffffff',
    left: framePadding,
    top: framePadding,
    fontFamily: 'Inter, system-ui, sans-serif',
  });

  // Subtitle
  const subtitle = new Text('Tell me about the app you want to build', {
    fontSize: 14,
    fill: '#999',
    left: framePadding,
    top: framePadding + 35,
    fontFamily: 'Inter, system-ui, sans-serif',
  });

  // Form fields
  const fields = [
    { label: 'App Name', placeholder: 'e.g., FitTracker', top: 120 },
    { label: 'Tagline / Description', placeholder: 'e.g., Track your fitness journey', top: 200 },
    { label: 'Category', placeholder: 'e.g., Health & Fitness', top: 280 },
    { label: 'Target Audience', placeholder: 'e.g., Fitness enthusiasts aged 18-35', top: 360 },
  ];

  const fieldElements: any[] = [];

  fields.forEach(({ label, placeholder, top }) => {
    // Label
    const labelText = new Text(label, {
      fontSize: 12,
      fontWeight: '600',
      fill: '#ccc',
      left: framePadding,
      top,
      fontFamily: 'Inter, system-ui, sans-serif',
    });

    // Input field background
    const inputBg = new Rect({
      width: frameWidth - framePadding * 2,
      height: 40,
      fill: '#2a2a2a',
      stroke: '#444',
      strokeWidth: 1,
      rx: 6,
      ry: 6,
      left: framePadding,
      top: top + 20,
    });

    // Placeholder text
    const placeholderText = new Text(placeholder, {
      fontSize: 13,
      fill: '#666',
      left: framePadding + 12,
      top: top + 30,
      fontFamily: 'Inter, system-ui, sans-serif',
    });

    fieldElements.push(labelText, inputBg, placeholderText);
  });

  // Color section
  const colorSectionTop = 480;
  const colorLabel = new Text('Brand Colors', {
    fontSize: 12,
    fontWeight: '600',
    fill: '#ccc',
    left: framePadding,
    top: colorSectionTop,
    fontFamily: 'Inter, system-ui, sans-serif',
  });

  const colorSwatches = [
    { label: 'Primary', color: '#3B82F6', left: 0 },
    { label: 'Secondary', color: '#8B5CF6', left: 150 },
    { label: 'Accent', color: '#F59E0B', left: 300 },
  ];

  const colorElements: any[] = [colorLabel];

  colorSwatches.forEach(({ label, color, left }) => {
    // Color swatch
    const swatch = new Rect({
      width: 60,
      height: 60,
      fill: color,
      stroke: '#444',
      strokeWidth: 1,
      rx: 8,
      ry: 8,
      left: framePadding + left,
      top: colorSectionTop + 25,
    });

    // Color label
    const swatchLabel = new Text(label, {
      fontSize: 11,
      fill: '#999',
      left: framePadding + left,
      top: colorSectionTop + 92,
      fontFamily: 'Inter, system-ui, sans-serif',
    });

    colorElements.push(swatch, swatchLabel);
  });

  // Helper text
  const helperText = new Text('AI can help fill this out, or you can type directly', {
    fontSize: 11,
    fill: '#666',
    left: framePadding,
    top: frameHeight - 50,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontStyle: 'italic',
  });

  // Combine all elements
  const allElements = [background, title, subtitle, ...fieldElements, ...colorElements, helperText];

  const group = new Group(allElements, {
    left: 100,
    top: 100,
    selectable: true,
    hasControls: true,
  });

  canvas.add(group);
  canvas.renderAll();

  return group;
}
