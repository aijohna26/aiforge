import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.body}>Start prompting to customize your app, or open the tabs view.</Text>
      <Link href="/(tabs)" style={styles.link}>
        Go to Tabs
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
});
