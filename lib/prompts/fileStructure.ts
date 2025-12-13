/**
 * Expo project structure conventions and file organization
 */

export function fileStructure(): string {
  return `
# Expo Project Structure & File Organization

## Standard Expo Router Layout

\`\`\`
project-root/
├── app/                      # Expo Router directory (file-based routing)
│   ├── (tabs)/              # Tab navigation group
│   │   ├── index.tsx        # Home tab (route: /)
│   │   ├── explore.tsx      # Explore tab (route: /explore)
│   │   └── settings.tsx     # Settings tab (route: /settings)
│   ├── (auth)/              # Auth flow group (can be hidden)
│   │   ├── login.tsx        # Login screen
│   │   └── register.tsx     # Register screen
│   ├── [id].tsx             # Dynamic route (e.g., /123)
│   ├── modal.tsx            # Modal screen
│   ├── _layout.tsx          # Root layout
│   └── +not-found.tsx       # 404 page
├── components/              # Reusable components
│   ├── ui/                  # UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── features/            # Feature-specific components
│   │   ├── UserProfile.tsx
│   │   └── PostCard.tsx
│   └── layout/              # Layout components
│       ├── Container.tsx
│       └── Header.tsx
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useColorScheme.ts
│   └── useApi.ts
├── lib/                     # Utilities and helpers
│   ├── api/                 # API client
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── utils/               # Utility functions
│   │   ├── format.ts
│   │   └── validation.ts
│   └── types.ts             # Shared TypeScript types
├── constants/               # App constants
│   ├── Colors.ts            # Color palette
│   ├── Layout.ts            # Layout constants
│   └── Config.ts            # App configuration
├── assets/                  # Static assets
│   ├── images/              # Image files
│   │   ├── icon.png
│   │   ├── splash.png
│   │   └── logo@2x.png
│   ├── fonts/               # Custom fonts
│   │   └── SpaceMono-Regular.ttf
│   └── data/                # Static data files
│       └── countries.json
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
└── .env                     # Environment variables (not in git)
\`\`\`

## Expo Router Conventions

### File-Based Routing

#### Basic Routes
\`\`\`
app/index.tsx       → /
app/about.tsx       → /about
app/contact.tsx     → /contact
\`\`\`

#### Dynamic Routes
\`\`\`
app/posts/[id].tsx              → /posts/123
app/users/[userId]/posts.tsx    → /users/42/posts
app/[...rest].tsx               → Catch-all route
\`\`\`

#### Grouped Routes (Not in URL)
\`\`\`
app/(tabs)/index.tsx    → /
app/(tabs)/profile.tsx  → /profile
app/(auth)/login.tsx    → /login
\`\`\`

### Layout Files

#### Root Layout (\`app/_layout.tsx\`)
\`\`\`typescript
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
\`\`\`

#### Tab Layout (\`app/(tabs)/_layout.tsx\`)
\`\`\`typescript
import { Tabs } from 'expo-router';
import { TabBarIcon } from '@/components/ui/TabBarIcon';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
\`\`\`

## File Naming Conventions

### Components
\`\`\`
✅ Button.tsx              (PascalCase)
✅ UserProfileCard.tsx     (PascalCase, descriptive)
✅ NavigationHeader.tsx    (PascalCase)
❌ button.tsx              (Wrong: lowercase)
❌ user-profile.tsx        (Wrong: kebab-case)
❌ BUTTON.tsx              (Wrong: all caps)
\`\`\`

### Screens/Pages
\`\`\`
✅ app/index.tsx           (lowercase for routes)
✅ app/profile.tsx         (lowercase)
✅ app/[id].tsx            (lowercase with brackets)
❌ app/Profile.tsx         (Wrong: PascalCase for routes)
❌ app/user-profile.tsx    (Wrong: kebab-case)
\`\`\`

### Utilities & Helpers
\`\`\`
✅ formatDate.ts           (camelCase)
✅ apiClient.ts            (camelCase)
✅ validateEmail.ts        (camelCase)
❌ FormatDate.ts           (Wrong: PascalCase)
❌ format-date.ts          (Wrong: kebab-case)
\`\`\`

### Constants
\`\`\`
✅ Colors.ts               (PascalCase)
✅ Config.ts               (PascalCase)
✅ ApiEndpoints.ts         (PascalCase)
❌ colors.ts               (Wrong: lowercase)
❌ COLORS.ts               (Wrong: all caps)
\`\`\`

### Hooks
\`\`\`
✅ useAuth.ts              (camelCase, starts with 'use')
✅ useColorScheme.ts       (camelCase)
✅ useApiClient.ts         (camelCase)
❌ auth.ts                 (Wrong: missing 'use' prefix)
❌ UseAuth.ts              (Wrong: PascalCase)
❌ use-auth.ts             (Wrong: kebab-case)
\`\`\`

## Import Aliases

### Configuration (\`tsconfig.json\`)
\`\`\`json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/hooks/*": ["hooks/*"],
      "@/lib/*": ["lib/*"],
      "@/constants/*": ["constants/*"],
      "@/assets/*": ["assets/*"]
    }
  }
}
\`\`\`

### Usage
\`\`\`typescript
// ✅ Use alias imports
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/Colors';

// ❌ Avoid relative imports for shared code
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
\`\`\`

## Component Organization

### Single Component Per File
\`\`\`typescript
// ✅ Good: One main component per file
// components/ui/Button.tsx
import { Pressable, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export function Button({ title, onPress }: ButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
\`\`\`

### Multiple Related Components (Only if small)
\`\`\`typescript
// ⚠️ Only for small, tightly coupled components
// components/ui/Card.tsx
export function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

export function CardHeader({ title }) {
  return <Text style={styles.header}>{title}</Text>;
}

export function CardContent({ children }) {
  return <View style={styles.content}>{children}</View>;
}
\`\`\`

## Asset Organization

### Images
\`\`\`
assets/images/
  ├── icon.png           (App icon)
  ├── splash.png         (Splash screen)
  ├── logo.png           (1x, baseline)
  ├── logo@2x.png        (2x for Retina)
  ├── logo@3x.png        (3x for Retina HD)
  └── backgrounds/
      ├── hero.png
      └── pattern.png
\`\`\`

### Usage
\`\`\`typescript
import { Image } from 'expo-image';

// ✅ Require local images
<Image
  source={require('@/assets/images/logo.png')}
  style={{ width: 100, height: 100 }}
/>

// ✅ Remote images with URI
<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 100, height: 100 }}
/>
\`\`\`

### Fonts
\`\`\`
assets/fonts/
  ├── SpaceMono-Regular.ttf
  ├── SpaceMono-Bold.ttf
  └── Roboto-Regular.ttf
\`\`\`

## Environment Variables

### Configuration (\`.env\`)
\`\`\`
API_URL=https://api.example.com
API_KEY=your_api_key_here
ENABLE_ANALYTICS=true
\`\`\`

### Usage
\`\`\`typescript
import Constants from 'expo-constants';

// Access via expo-constants
const apiUrl = Constants.expoConfig?.extra?.apiUrl;

// Or use expo-env
import { API_URL, API_KEY } from '@env';
\`\`\`

## Configuration Files

### \`app.json\`
\`\`\`json
{
  "expo": {
    "name": "MyApp",
    "slug": "my-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash.png",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.mycompany.myapp"
    },
    "android": {
      "package": "com.mycompany.myapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png"
      }
    }
  }
}
\`\`\`

## Best Practices

### DO
✅ Use Expo Router for navigation
✅ Keep components focused and single-purpose
✅ Use TypeScript interfaces for props
✅ Organize by feature when app grows
✅ Use absolute imports with @ prefix
✅ Keep file names descriptive and clear

### DON'T
❌ Mix different naming conventions
❌ Create deeply nested folder structures
❌ Put business logic in components
❌ Use generic names (Component.tsx, Screen.tsx)
❌ Skip TypeScript types
❌ Commit .env files to version control
`;
}
