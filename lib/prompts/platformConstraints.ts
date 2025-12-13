/**
 * Platform-specific constraints and technology stack rules
 */

export function platformConstraints(): string {
  return `
# Technology Stack & Platform Constraints

## MUST USE

### Core Technologies
- **Expo SDK** for React Native development (latest stable version)
- **Expo Router** for file-based navigation
- **TypeScript** for type safety and better developer experience
- **expo-image** for optimized image handling
- **expo-secure-store** for sensitive data storage

### Preferred Libraries
- **expo-linear-gradient** for gradients (not react-native-linear-gradient)
- **expo-constants** for app configuration
- **expo-status-bar** for status bar control
- **@react-navigation** (only if Expo Router doesn't fit)

## NEVER MODIFY (Locked Files)

These files should not be modified without explicit user confirmation:
- \`app.json\` - Expo configuration
- \`babel.config.js\` - Babel configuration
- \`metro.config.js\` - Metro bundler configuration
- \`tsconfig.json\` - TypeScript configuration (preserve base settings)

## iOS-Specific Rules

### Safe Areas
\`\`\`typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }}>
      {/* Content */}
    </View>
  );
}
\`\`\`

### iOS Guidelines
- Follow iOS Human Interface Guidelines
- Test on multiple screen sizes (SE, standard, Plus, Pro Max)
- Handle landscape orientation properly
- Use SF Symbols when available (via icons library)
- Respect system haptics and animations

## Android-Specific Rules

### Status Bar
\`\`\`typescript
import { StatusBar } from 'expo-status-bar';

function App() {
  return (
    <>
      <StatusBar style="auto" />
      {/* Content */}
    </>
  );
}
\`\`\`

### Android Guidelines
- Follow Material Design 3 guidelines
- Test on multiple screen densities (mdpi, xhdpi, xxhdpi)
- Handle back button behavior appropriately
- Consider various notch/cutout configurations
- Use elevation for Android shadows

## Cross-Platform Rules

### ALWAYS Test on Both Platforms
- Verify layouts work on iOS and Android
- Test navigation flows on both platforms
- Check that platform-specific features work correctly
- Ensure consistent user experience

### Platform-Specific Code
\`\`\`typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
\`\`\`

### Minimize Platform-Specific Code
- Use platform-agnostic solutions when possible
- Keep platform-specific code in separate files when needed
- Use \`Platform.select()\` for small differences
- Create separate components for major platform differences

## Deprecated APIs to AVOID

### NEVER Use These
❌ \`AsyncStorage\` from 'react-native' (use expo-secure-store or expo-sqlite)
❌ \`Image\` from 'react-native' (use expo-image)
❌ \`Alert\` (create custom modal components)
❌ \`Linking.openURL()\` without expo-web-browser
❌ Direct access to \`Dimensions\` (use useWindowDimensions hook)

### Use Modern Alternatives
✅ \`expo-secure-store\` for sensitive data
✅ \`expo-image\` for images
✅ Custom modal components for alerts
✅ \`expo-web-browser\` for opening URLs
✅ \`useWindowDimensions()\` hook for dimensions

## Web-Only APIs to AVOID

These APIs don't exist in React Native:
❌ \`window\`, \`document\`, DOM APIs
❌ \`localStorage\`, \`sessionStorage\`
❌ CSS files and stylesheets
❌ HTML elements (\`<div>\`, \`<span>\`, \`<a>\`)
❌ \`className\` prop (use \`style\` prop)

## Performance Requirements

### Bundle Size
- Keep total bundle size under 50MB
- Use Hermes JavaScript engine (enabled by default)
- Implement code splitting for large apps
- Lazy load screens and components when possible

### Runtime Performance
- Maintain 60 FPS for animations
- Keep JavaScript thread responsive
- Use \`InteractionManager\` for heavy operations
- Profile performance regularly

## Accessibility Requirements

### ALWAYS Include
- Accessible labels on interactive elements
- Screen reader support
- Sufficient color contrast (WCAG AA minimum)
- Touch targets at least 44x44 points
- Keyboard navigation support

### Example
\`\`\`typescript
<Pressable
  accessible={true}
  accessibilityLabel="Submit form"
  accessibilityHint="Double tap to submit the form"
  accessibilityRole="button"
>
  <Text>Submit</Text>
</Pressable>
\`\`\`
`;
}
