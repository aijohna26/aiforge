/**
 * Instructions for handling API keys, secrets, and environment variables
 */

export function secretsInstructions(): string {
  return `
# Secrets & Environment Variables

## Three-Step Process for External APIs

When implementing features that require API keys or secrets, follow this workflow:

### Step 1: Start with Example Data
DON'T write real data or make API calls yet. Instead:
- Show example/mock data in the UI
- Make UI fully functional with fake data
- Demonstrate what the feature will look like
- Tell user this is example data

**Example:**
\`\`\`typescript
// ✅ Good: Start with example data
const weatherData = {
  temperature: 72,
  condition: 'Sunny',
  location: 'San Francisco'
};

// Display in UI
<Text>Temperature: {weatherData.temperature}°F</Text>
<Text>Condition: {weatherData.condition}</Text>
\`\`\`

### Step 2: Guide User to Setup
Provide clear, step-by-step instructions:

**Template:**
\`\`\`
To use real [service name] data:

1. Sign up at [service-url] (free tier available)
2. Generate your API key
3. Add to .env file:
   [KEY_NAME]=your_key_here
4. Let me know when you're ready

Note: Keep your .env file secure and never commit it to version control.
\`\`\`

### Step 3: Implement Real Integration
Only after user confirms setup:
- Add environment variable access
- Implement actual API calls
- Add proper error handling
- Handle rate limits
- Cache responses if appropriate

## Environment Variable Configuration

### .env File Format
\`\`\`bash
# API Keys
OPENAI_API_KEY=sk-...
WEATHER_API_KEY=abc123...
STRIPE_PUBLIC_KEY=pk_...

# Configuration
API_BASE_URL=https://api.example.com
ENABLE_ANALYTICS=true
DEBUG_MODE=false

# Never commit actual values!
\`\`\`

### Accessing Environment Variables

#### Option 1: expo-constants (Recommended)
\`\`\`typescript
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.apiKey;
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
\`\`\`

**Configure in app.json:**
\`\`\`json
{
  "expo": {
    "extra": {
      "apiKey": process.env.API_KEY,
      "apiUrl": process.env.API_URL
    }
  }
}
\`\`\`

#### Option 2: react-native-dotenv
\`\`\`typescript
import { API_KEY, API_URL } from '@env';

// Use directly
const headers = {
  'Authorization': \`Bearer \${API_KEY}\`
};
\`\`\`

## Security Best Practices

### DO ✅
- Store secrets in .env file
- Add .env to .gitignore
- Use environment variables in code
- Validate API responses
- Handle authentication errors
- Implement rate limiting
- Use HTTPS for all API calls
- Rotate keys regularly

### DON'T ❌
- Hardcode API keys in source code
- Commit .env files
- Share keys in screenshots
- Log sensitive data
- Expose keys in error messages
- Use keys in client-side code if avoidable
- Skip error handling

## Common Services Setup

### OpenAI API
\`\`\`bash
# .env
OPENAI_API_KEY=sk-...
\`\`\`

\`\`\`typescript
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.openaiApiKey;

async function generateText(prompt: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI error:', error);
    throw error;
  }
}
\`\`\`

### Firebase
\`\`\`bash
# .env
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
\`\`\`

\`\`\`typescript
import { initializeApp } from 'firebase/app';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
};

const app = initializeApp(firebaseConfig);
\`\`\`

### Stripe
\`\`\`bash
# .env
STRIPE_PUBLIC_KEY=pk_test_...
\`\`\`

\`\`\`typescript
import Constants from 'expo-constants';

const stripePublicKey = Constants.expoConfig?.extra?.stripePublicKey;

// Initialize Stripe
import { StripeProvider } from '@stripe/stripe-react-native';

function App() {
  return (
    <StripeProvider publishableKey={stripePublicKey}>
      {/* Your app */}
    </StripeProvider>
  );
}
\`\`\`

## Error Handling for Missing Keys

### Check Before Using
\`\`\`typescript
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.apiKey;

if (!apiKey) {
  console.error('API key not configured');
  // Show user-friendly message
  return (
    <View>
      <Text>API key not configured</Text>
      <Text>Please add API_KEY to your .env file</Text>
    </View>
  );
}

// Proceed with API calls
\`\`\`

### Graceful Degradation
\`\`\`typescript
function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiKey = Constants.expoConfig?.extra?.weatherApiKey;

    if (!apiKey) {
      setError('API key not configured');
      return;
    }

    fetchWeather(apiKey)
      .then(setWeather)
      .catch(setError);
  }, []);

  if (error) {
    return <Text>Could not load weather: {error}</Text>;
  }

  if (!weather) {
    return <Text>Loading weather...</Text>;
  }

  return <Text>Temperature: {weather.temp}°F</Text>;
}
\`\`\`

## Development vs Production

### Different Keys per Environment
\`\`\`bash
# .env.development
API_URL=https://dev-api.example.com
API_KEY=dev_key_123

# .env.production
API_URL=https://api.example.com
API_KEY=prod_key_456
\`\`\`

### Configuration
\`\`\`typescript
import Constants from 'expo-constants';

const isDev = __DEV__;
const config = {
  apiUrl: isDev
    ? 'https://dev-api.example.com'
    : Constants.expoConfig?.extra?.apiUrl,
  apiKey: isDev
    ? 'dev_key'
    : Constants.expoConfig?.extra?.apiKey,
};
\`\`\`

## Progressive Disclosure Pattern

### Example: Weather API Integration

**Step 1: Mock Data (Initial Implementation)**
\`\`\`typescript
export function WeatherScreen() {
  // Start with example data
  const exampleWeather = {
    temperature: 72,
    condition: 'Sunny',
    humidity: 45,
    location: 'San Francisco, CA'
  };

  return (
    <View style={styles.container}>
      <Text style={styles.note}>
        📝 Currently showing example data
      </Text>
      <Text style={styles.temp}>{exampleWeather.temperature}°F</Text>
      <Text style={styles.condition}>{exampleWeather.condition}</Text>
      <Text style={styles.humidity}>Humidity: {exampleWeather.humidity}%</Text>
      <Text style={styles.location}>{exampleWeather.location}</Text>
    </View>
  );
}
\`\`\`

**Step 2: User Message**
\`\`\`
✅ Weather screen created with example data!

To use real weather data:
1. Sign up at openweathermap.org (free tier: 1000 calls/day)
2. Get your API key from the dashboard
3. Add to .env file: WEATHER_API_KEY=your_key_here
4. Let me know when ready and I'll integrate the real API

The UI is fully functional and shows what the real data will look like.
\`\`\`

**Step 3: Real Integration (After User Confirms)**
\`\`\`typescript
export function WeatherScreen() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRealWeather();
  }, []);

  async function fetchRealWeather() {
    const apiKey = Constants.expoConfig?.extra?.weatherApiKey;

    if (!apiKey) {
      setError('API key not configured');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        \`https://api.openweathermap.org/data/2.5/weather?q=SanFrancisco&appid=\${apiKey}&units=imperial\`
      );

      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();
      setWeather({
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        location: \`\${data.name}, \${data.sys.country}\`
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <View style={styles.container}>
      <Text style={styles.temp}>{weather.temperature}°F</Text>
      <Text style={styles.condition}>{weather.condition}</Text>
      <Text style={styles.humidity}>Humidity: {weather.humidity}%</Text>
      <Text style={styles.location}>{weather.location}</Text>
    </View>
  );
}
\`\`\`

## Communication Templates

### Recommending an API
\`\`\`
For [feature], I recommend using [Service Name]:
• Free tier includes: [what's included]
• Easy to integrate
• Good documentation
• Reliable and fast

Setup steps:
1. Sign up at [URL]
2. Generate API key
3. Add to .env: [KEY_NAME]=your_key
4. Let me know when ready
\`\`\`

### After User Confirms Setup
\`\`\`
Great! I'll now integrate the [Service Name] API.

What I'm adding:
• API client with proper error handling
• Rate limiting and caching
• Loading and error states
• Secure key management

Deploying now...
\`\`\`

Remember: Always start with mock data, guide setup clearly, and only integrate real APIs after user confirmation.
`;
}
