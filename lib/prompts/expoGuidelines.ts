/**
 * Comprehensive Expo and React Native guidelines
 * This is the equivalent of Chef's 37KB Convex guidelines
 * Target: 30KB+ of mobile-specific guidelines
 */

export function expoGuidelines(): string {
  return `
# Expo & React Native Comprehensive Guidelines

## Core React Native Components

### View Component

The fundamental container component in React Native.

#### Basic Usage
\`\`\`typescript
import { View } from 'react-native';

function Container() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Content */}
    </View>
  );
}
\`\`\`

#### Key Differences from Web
- **Default flexDirection is 'column'** (web is 'row')
- No CSS cascade (each element needs explicit styles)
- Use \`style\` prop, not \`className\`
- Numbers for dimensions (not strings like "100px")

#### Common Patterns
\`\`\`typescript
// Flex container (most common)
<View style={{ flex: 1 }}>
  {/* Takes all available space */}
</View>

// Centered content
<View style={{
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center'
}}>
  {/* Centered horizontally and vertically */}
</View>

// Row layout
<View style={{ flexDirection: 'row', gap: 12 }}>
  {/* Items in horizontal row */}
</View>

// Absolute positioning
<View style={{
  position: 'absolute',
  top: 0,
  right: 0,
  padding: 10
}}>
  {/* Positioned absolutely */}
</View>
\`\`\`

#### Common Props
- \`style\`: Styling object or array
- \`onLayout\`: Called when layout changes
- \`pointerEvents\`: Control touch handling
- \`hitSlop\`: Extend touchable area
- \`accessible\`: Screen reader support
- \`testID\`: For testing

### Text Component

ALL text must be wrapped in Text component.

#### Basic Usage
\`\`\`typescript
import { Text } from 'react-native';

function Label() {
  return (
    <Text style={{ fontSize: 16, color: '#333' }}>
      Hello World
    </Text>
  );
}
\`\`\`

#### Critical Rules
❌ **NEVER** put text directly in View:
\`\`\`typescript
// ❌ WRONG - Will crash!
<View>Hello</View>

// ✅ CORRECT
<View>
  <Text>Hello</Text>
</View>
\`\`\`

#### Text Doesn't Inherit Styles
\`\`\`typescript
// ❌ Doesn't work (no style inheritance)
<View style={{ color: 'red' }}>
  <Text>Not red</Text>
</View>

// ✅ Explicit styling needed
<View>
  <Text style={{ color: 'red' }}>Red text</Text>
</View>
\`\`\`

#### Nested Text (Style Inheritance Works)
\`\`\`typescript
// ✅ Inner Text inherits from outer Text
<Text style={{ fontWeight: 'bold', fontSize: 18 }}>
  Bold parent
  <Text style={{ color: 'red' }}>
    {' and red child'}
  </Text>
</Text>
\`\`\`

#### Text Props
- \`numberOfLines\`: Limit lines (with ellipsis)
- \`ellipsizeMode\`: Where to add ellipsis ('tail', 'head', 'middle')
- \`selectable\`: Allow text selection
- \`onPress\`: Make text tappable (but prefer Pressable wrapper)

#### Common Patterns
\`\`\`typescript
// Truncated text
<Text numberOfLines={2} ellipsizeMode="tail">
  Long text that will be truncated after two lines...
</Text>

// Selectable text
<Text selectable>
  User can select and copy this text
</Text>

// Links (wrap in Pressable)
<Pressable onPress={openLink}>
  <Text style={{ color: '#007AFF', textDecorationLine: 'underline' }}>
    Learn more
  </Text>
</Pressable>
\`\`\`

### ScrollView Component

Scrollable container for content.

#### When to Use
✅ Use ScrollView for:
- Small amounts of content
- Forms and simple layouts
- Content that fits in memory (<50 items)

❌ DON'T use ScrollView for:
- Long lists (>50 items) - use FlatList instead
- Infinite scrolling - use FlatList
- Performance-critical lists

#### Basic Usage
\`\`\`typescript
import { ScrollView } from 'react-native';

function Feed() {
  return (
    <ScrollView style={{ flex: 1 }}>
      {/* Content */}
    </ScrollView>
  );
}
\`\`\`

#### Common Patterns
\`\`\`typescript
// Horizontal scroll
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {items.map(item => <Card key={item.id} />)}
</ScrollView>

// Pull to refresh
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  }
>
  {/* Content */}
</ScrollView>

// Keyboard aware (for forms)
<ScrollView
  keyboardShouldPersistTaps="handled"
  contentContainerStyle={{ padding: 20 }}
>
  <TextInput />
  <TextInput />
</ScrollView>

// Snap to interval
<ScrollView
  horizontal
  pagingEnabled
  snapToInterval={width}
  decelerationRate="fast"
>
  {/* Pages */}
</ScrollView>
\`\`\`

#### Important Props
- \`contentContainerStyle\`: Style for content wrapper
- \`showsVerticalScrollIndicator\`: Show scroll bar
- \`bounces\`: Bounce effect (iOS)
- \`scrollEnabled\`: Enable/disable scrolling
- \`onScroll\`: Scroll event handler
- \`refreshControl\`: Pull-to-refresh component

### FlatList Component

Performant list rendering for large datasets.

#### When to Use
✅ ALWAYS use FlatList for:
- Lists with >50 items
- Infinite scrolling
- Performance-critical lists
- Dynamic data

#### Basic Usage
\`\`\`typescript
import { FlatList } from 'react-native';

function UserList({ users }: { users: User[] }) {
  return (
    <FlatList
      data={users}
      renderItem={({ item }) => <UserCard user={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
\`\`\`

#### Required Props
\`\`\`typescript
<FlatList
  data={items}                              // Array of data
  renderItem={({ item, index }) => <Item />}  // Render function
  keyExtractor={(item) => item.id}          // Unique key extractor
/>
\`\`\`

#### Performance Optimization
\`\`\`typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  // Performance props
  initialNumToRender={10}        // Render 10 items initially
  maxToRenderPerBatch={10}       // Render 10 items per batch
  windowSize={5}                 // Keep 5 screens worth of items
  removeClippedSubviews          // Remove off-screen items (Android)
  // For fixed height items
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
\`\`\`

#### Common Patterns
\`\`\`typescript
// Empty state
<FlatList
  data={items}
  renderItem={renderItem}
  ListEmptyComponent={
    <View style={styles.empty}>
      <Text>No items found</Text>
    </View>
  }
/>

// Header and footer
<FlatList
  data={items}
  renderItem={renderItem}
  ListHeaderComponent={<Header />}
  ListFooterComponent={<Footer />}
/>

// Pull to refresh
<FlatList
  data={items}
  renderItem={renderItem}
  refreshing={refreshing}
  onRefresh={handleRefresh}
/>

// Load more (infinite scroll)
<FlatList
  data={items}
  renderItem={renderItem}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={
    loading ? <ActivityIndicator /> : null
  }
/>

// Sections with separator
<FlatList
  data={items}
  renderItem={renderItem}
  ItemSeparatorComponent={() => (
    <View style={{ height: 1, backgroundColor: '#E5E5E5' }} />
  )}
/>
\`\`\`

#### Memoization (Critical for Performance)
\`\`\`typescript
// ✅ Memoize render function
const renderItem = useCallback(({ item }: { item: User }) => (
  <UserCard user={item} />
), []);

const keyExtractor = useCallback((item: User) => item.id, []);

// ✅ Memoize item component
const UserCard = memo(({ user }: { user: User }) => {
  return (
    <View>
      <Text>{user.name}</Text>
    </View>
  );
});

<FlatList
  data={users}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
/>
\`\`\`

### TextInput Component

Input field for user text entry.

#### Basic Usage
\`\`\`typescript
import { TextInput } from 'react-native';

function NameInput() {
  const [name, setName] = useState('');

  return (
    <TextInput
      value={name}
      onChangeText={setName}
      placeholder="Enter your name"
      style={styles.input}
    />
  );
}
\`\`\`

#### Common Types
\`\`\`typescript
// Email input
<TextInput
  keyboardType="email-address"
  autoCapitalize="none"
  autoComplete="email"
  textContentType="emailAddress"
/>

// Password input
<TextInput
  secureTextEntry
  autoCapitalize="none"
  autoComplete="password"
  textContentType="password"
/>

// Phone number
<TextInput
  keyboardType="phone-pad"
  autoComplete="tel"
  textContentType="telephoneNumber"
/>

// Number input
<TextInput
  keyboardType="numeric"
/>

// Multiline (textarea)
<TextInput
  multiline
  numberOfLines={4}
  textAlignVertical="top"
/>
\`\`\`

#### Styling TextInput
\`\`\`typescript
const styles = StyleSheet.create({
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
});
\`\`\`

#### Form Handling
\`\`\`typescript
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    // Handle form submission
  };

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={() => passwordRef.current?.focus()}
        returnKeyType="next"
        blurOnSubmit={false}
      />
      <TextInput
        ref={passwordRef}
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        secureTextEntry
      />
    </View>
  );
}
\`\`\`

### Pressable Component

Modern touchable component with advanced feedback.

#### Why Pressable?
✅ Use Pressable (modern, flexible)
❌ Avoid TouchableOpacity, TouchableHighlight (legacy)

#### Basic Usage
\`\`\`typescript
import { Pressable, Text } from 'react-native';

function Button({ onPress, title }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}
\`\`\`

#### Advanced Feedback
\`\`\`typescript
<Pressable
  onPress={handlePress}
  style={({ pressed }) => ({
    backgroundColor: pressed ? '#0056b3' : '#007AFF',
    opacity: pressed ? 0.8 : 1,
  })}
  // Android ripple effect
  android_ripple={{
    color: 'rgba(0, 0, 0, 0.1)',
    borderless: false,
  }}
  // Extend touchable area
  hitSlop={8}
>
  <Text>Press Me</Text>
</Pressable>
\`\`\`

#### Press Events
\`\`\`typescript
<Pressable
  onPress={() => console.log('Pressed')}
  onPressIn={() => console.log('Press started')}
  onPressOut={() => console.log('Press ended')}
  onLongPress={() => console.log('Long pressed')}
  delayLongPress={500}
>
  <Text>Interactive Element</Text>
</Pressable>
\`\`\`

### Image Component

⚠️ **Use expo-image instead of React Native's Image**

\`\`\`typescript
// ❌ DON'T use react-native Image
import { Image } from 'react-native';

// ✅ DO use expo-image
import { Image } from 'expo-image';
\`\`\`

#### Why expo-image?
- Better performance
- Better caching
- More image formats (WebP, AVIF)
- Placeholder support
- Blur hash support

#### Usage
\`\`\`typescript
import { Image } from 'expo-image';

// Local image
<Image
  source={require('@/assets/images/logo.png')}
  style={{ width: 100, height: 100 }}
  contentFit="cover"
/>

// Remote image
<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  placeholder={blurhash}
/>

// With placeholder
<Image
  source={{ uri: imageUrl }}
  placeholder={require('@/assets/placeholder.png')}
  contentFit="cover"
  transition={1000}
/>
\`\`\`

## Styling in React Native

### StyleSheet API

ALWAYS use StyleSheet.create() for styles.

#### Why?
- Performance optimization
- Validation of style properties
- Better error messages

#### Usage
\`\`\`typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});

// Use in component
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>
\`\`\`

### Flexbox Layout

Default layout system in React Native.

#### Key Differences from Web
\`\`\`typescript
// React Native defaults
{
  display: 'flex',           // Always flex
  flexDirection: 'column',   // Column by default (web is 'row')
  alignItems: 'stretch',     // Stretch by default
  flexShrink: 0,             // Don't shrink by default
}
\`\`\`

#### Common Layouts
\`\`\`typescript
// Center everything
{
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
}

// Space between items
{
  flexDirection: 'row',
  justifyContent: 'space-between',
}

// Evenly distribute
{
  flexDirection: 'row',
  justifyContent: 'space-around',
}

// Fill available space
{
  flex: 1,
}

// Fixed size
{
  width: 100,
  height: 100,
}

// Percentage (use flex instead when possible)
{
  width: '50%',
}
\`\`\`

### Dimensions and Units

#### Numbers Only
\`\`\`typescript
// ✅ CORRECT - numbers
{
  width: 100,
  height: 50,
  padding: 20,
  margin: 10,
}

// ❌ WRONG - no units
{
  width: '100px',    // ❌ No px!
  height: '50%',     // ⚠️ Use flex instead
  padding: '20pt',   // ❌ No units!
}
\`\`\`

#### Responsive Sizing
\`\`\`typescript
import { useWindowDimensions } from 'react-native';

function ResponsiveComponent() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={{
      width: width * 0.9,       // 90% of screen width
      height: height * 0.5,     // 50% of screen height
    }}>
      {/* Content */}
    </View>
  );
}
\`\`\`

### Colors

#### Format
\`\`\`typescript
// ✅ Valid color formats
{
  color: '#FF0000',                  // Hex
  color: '#F00',                     // Short hex
  color: 'rgb(255, 0, 0)',           // RGB
  color: 'rgba(255, 0, 0, 0.5)',     // RGBA
  color: 'hsl(0, 100%, 50%)',        // HSL
  color: 'hsla(0, 100%, 50%, 0.5)',  // HSLA
  color: 'red',                      // Named colors
}
\`\`\`

### Platform-Specific Styles

#### Using Platform.select()
\`\`\`typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.select({
      ios: 20,
      android: 10,
    }),
  },
  text: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
});
\`\`\`

#### Shadows (Platform-Specific)
\`\`\`typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    // iOS shadow
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

## Navigation with Expo Router

### File-Based Routing

Expo Router uses file structure for navigation.

#### Basic Structure
\`\`\`
app/
├── index.tsx           → /
├── about.tsx           → /about
├── profile.tsx         → /profile
└── settings.tsx        → /settings
\`\`\`

#### Dynamic Routes
\`\`\`
app/
├── posts/
│   ├── [id].tsx       → /posts/123
│   └── index.tsx      → /posts
└── users/
    └── [userId]/
        ├── profile.tsx → /users/42/profile
        └── posts.tsx   → /users/42/posts
\`\`\`

#### Groups (Not in URL)
\`\`\`
app/
├── (tabs)/            → Not in URL
│   ├── index.tsx      → /
│   └── profile.tsx    → /profile
└── (auth)/            → Not in URL
    ├── login.tsx      → /login
    └── register.tsx   → /register
\`\`\`

### Navigation Methods

#### Using router
\`\`\`typescript
import { router } from 'expo-router';

// Push (add to stack)
router.push('/profile');

// Replace (replace current route)
router.replace('/login');

// Go back
router.back();

// Navigate with params
router.push({
  pathname: '/posts/[id]',
  params: { id: '123' }
});
\`\`\`

#### Using Link Component
\`\`\`typescript
import { Link } from 'expo-router';

<Link href="/profile">
  <Text>Go to Profile</Text>
</Link>

// With params
<Link
  href={{
    pathname: '/posts/[id]',
    params: { id: post.id }
  }}
>
  <Text>{post.title}</Text>
</Link>
\`\`\`

### Layout Files

#### Root Layout
\`\`\`typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          title: 'Details'
        }}
      />
    </Stack>
  );
}
\`\`\`

#### Tab Layout
\`\`\`typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
\`\`\`

### Getting Route Parameters

\`\`\`typescript
// app/posts/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View>
      <Text>Post ID: {id}</Text>
    </View>
  );
}
\`\`\`

## Common Expo Modules

### expo-constants

Access app configuration and environment variables.

\`\`\`typescript
import Constants from 'expo-constants';

// App version
const version = Constants.expoConfig?.version;

// Platform info
const platform = Constants.platform;

// Environment variables (via extra)
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
\`\`\`

### expo-secure-store

Secure storage for sensitive data.

\`\`\`typescript
import * as SecureStore from 'expo-secure-store';

// Save
await SecureStore.setItemAsync('auth_token', token);

// Read
const token = await SecureStore.getItemAsync('auth_token');

// Delete
await SecureStore.deleteItemAsync('auth_token');
\`\`\`

⚠️ **NEVER use AsyncStorage for sensitive data!**

### expo-image (Already covered above)

### expo-status-bar

Control status bar appearance.

\`\`\`typescript
import { StatusBar } from 'expo-status-bar';

function App() {
  return (
    <>
      <StatusBar style="auto" />  // 'auto', 'light', 'dark'
      {/* Your app */}
    </>
  );
}
\`\`\`

### expo-splash-screen

Control splash screen behavior.

\`\`\`typescript
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible
SplashScreen.preventAutoHideAsync();

// Hide splash screen
await SplashScreen.hideAsync();

// Example: Hide after loading
useEffect(() => {
  async function prepare() {
    await loadFonts();
    await loadData();
    await SplashScreen.hideAsync();
  }
  prepare();
}, []);
\`\`\`

## Performance Best Practices

### Avoid Re-renders

\`\`\`typescript
// ✅ Memoize components
const UserCard = memo(({ user }: { user: User }) => {
  return <View>{/* Card content */}</View>;
});

// ✅ Memoize callbacks
const handlePress = useCallback(() => {
  console.log('Pressed');
}, []);

// ✅ Memoize expensive computations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);
\`\`\`

### List Performance

\`\`\`typescript
// ✅ Use FlatList for long lists
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  // Performance optimizations
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={Platform.OS === 'android'}
  getItemLayout={getItemLayout}  // For fixed-height items
/>

// ✅ Memoize render function
const renderItem = useCallback(({ item }) => (
  <ItemCard item={item} />
), []);
\`\`\`

### Image Optimization

\`\`\`typescript
// ✅ Specify dimensions
<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
/>

// ✅ Use appropriate sizes
// Don't load 4K images for thumbnails!

// ✅ Use caching
<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
/>
\`\`\`

### Bundle Size Optimization

\`\`\`typescript
// ✅ Specific imports
import { View, Text } from 'react-native';

// ❌ Avoid wildcard imports
import * as RN from 'react-native';

// ✅ Lazy load screens
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));

// ✅ Use Hermes (enabled by default in Expo)
// Provides faster startup and lower memory usage
\`\`\`

## Common Mistakes to AVOID

### ❌ Web-Only APIs
\`\`\`typescript
// ❌ These don't exist in React Native
window.localStorage
document.getElementById()
<div>, <span>, <a>
className prop
CSS files
\`\`\`

### ❌ Incorrect Text Usage
\`\`\`typescript
// ❌ Text outside Text component
<View>Hello World</View>

// ❌ Nesting View in Text
<Text>
  <View>Not allowed</View>
</Text>

// ✅ Correct
<View>
  <Text>Hello World</Text>
</View>
\`\`\`

### ❌ Navigation Anti-patterns
\`\`\`typescript
// ❌ Web navigation
window.location.href = '/profile';
<a href="/profile">Profile</a>
history.push('/profile');

// ✅ React Native navigation
import { router } from 'expo-router';
router.push('/profile');

import { Link } from 'expo-router';
<Link href="/profile">Profile</Link>
\`\`\`

### ❌ Styling Mistakes
\`\`\`typescript
// ❌ CSS-like syntax
{
  width: '100px',
  margin: '10px 20px',
  backgroundColor: '#FFF !important',
}

// ✅ React Native syntax
{
  width: 100,
  marginVertical: 10,
  marginHorizontal: 20,
  backgroundColor: '#FFFFFF',
}
\`\`\`

### ❌ Performance Issues
\`\`\`typescript
// ❌ ScrollView for long lists
<ScrollView>
  {items.map(item => <Card key={item.id} />)}
</ScrollView>

// ✅ FlatList for performance
<FlatList
  data={items}
  renderItem={({ item }) => <Card item={item} />}
  keyExtractor={(item) => item.id}
/>

// ❌ Inline functions in renderItem
<FlatList
  renderItem={({ item }) => <Card onPress={() => handlePress(item)} />}
/>

// ✅ Memoized render function
const renderItem = useCallback(({ item }) => (
  <Card item={item} onPress={handlePress} />
), [handlePress]);
\`\`\`

## TypeScript Best Practices

### Component Props
\`\`\`typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

function Button({ title, onPress, disabled, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </Pressable>
  );
}
\`\`\`

### Style Types
\`\`\`typescript
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface Styles {
  container: ViewStyle;
  title: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
\`\`\`

### Navigation Types
\`\`\`typescript
import { useLocalSearchParams } from 'expo-router';

// Define route params
type PostParams = {
  id: string;
  title?: string;
};

function PostScreen() {
  const { id, title } = useLocalSearchParams<PostParams>();

  return (
    <View>
      <Text>Post {id}</Text>
      {title && <Text>{title}</Text>}
    </View>
  );
}
\`\`\`

This comprehensive guide covers the essential React Native and Expo patterns. Always refer to official documentation for the most up-to-date information.
`;
}
