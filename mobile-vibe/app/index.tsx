import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function ProjectsList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      setLoading(true);
      // Fetch latest fragments to find active projects
      // We group by project_id by manually filtering unique IDs client-side
      const { data, error } = await supabase
        .from('fragments')
        .select('project_id, created_at, id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      if (data) {
        // Dedup by project_id
        const unique = new Map();
        data.forEach(item => {
          // Only include projects with an ID
          if (item.project_id && !unique.has(item.project_id)) {
            unique.set(item.project_id, item);
          }
        });
        setProjects(Array.from(unique.values()));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Vibes</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.project_id}
          ListEmptyComponent={<Text style={styles.empty}>No projects found. Create one in the Web Builder!</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/project/${item.project_id}`)}
            >
              <Text style={styles.title}>Project {item.project_id.substring(0, 8)}...</Text>
              <Text style={styles.subtitle}>ID: {item.project_id}</Text>
              <Text style={styles.date}>Last Edited: {new Date(item.created_at).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', paddingTop: 60 },
  header: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, paddingHorizontal: 4 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 8, fontFamily: 'monospace' },
  date: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16, color: 'gray' },
});