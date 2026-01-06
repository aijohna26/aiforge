# Asset Images Directory

This directory contains all image assets for the Expo app.

## Required Assets

The following files should be present:
- `icon.png` - App icon (1024x1024 recommended)
- `favicon.png` - Web favicon
- `splash.png` - Splash screen image
- `adaptive-icon.png` - Android adaptive icon
- `logo.png` - App logo (used in UI)

## Using Images

Import images in your components:

```tsx
import logo from '@/assets/images/logo.png';

// In your component
<Image source={logo} style={styles.logo} />
```

## Placeholder Images

For development, you can use stock photos from Pexels or create placeholder files.
The AI should always use valid Pexels URLs for images rather than creating local files.
