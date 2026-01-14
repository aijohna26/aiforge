import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ProjectDetail() {
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [fragment, setFragment] = useState<any>(null);

    useEffect(() => {
        if (id) {
            loadProjectData(id.toString());
        }
    }, [id]);

    async function loadProjectData(projectId: string) {
        try {
            setLoading(true);
            // Fetch the LATEST fragment for this project
            const { data, error } = await supabase
                .from('fragments')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            setFragment(data);
        } catch (e) {
            console.error('Error loading project:', e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={{ marginTop: 10 }}>Loading Vibe...</Text>
            </View>
        );
    }

    if (!fragment) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>Project Not Found (Active Fragment Missing)</Text>
            </View>
        );
    }

    const fileCount = fragment.files ? Object.keys(fragment.files).length : 0;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Project Workspace</Text>
                <Text style={styles.subtitle}>ID: {id}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Last Updated</Text>
                <Text style={styles.value}>{new Date(fragment.created_at).toLocaleString()}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Files Managed</Text>
                <Text style={styles.value}>{fileCount} files</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Content Preview</Text>
                {/* Simple list of top 5 files */}
                {fragment.files && Object.keys(fragment.files).slice(0, 5).map(f => (
                    <Text key={f} style={styles.fileItem}>📄 {f}</Text>
                ))}
                {fileCount > 5 && <Text style={{ color: '#999', marginTop: 4 }}>+ {fileCount - 5} more...</Text>}
            </View>

            <Text style={styles.todo}>
                [Coming Soon: Chat Interface & Code Editor]
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginTop: 40, marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#666', fontFamily: 'monospace' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16 },
    label: { fontSize: 12, color: '#999', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 },
    value: { fontSize: 18, color: '#333' },
    error: { color: 'red', fontSize: 16 },
    fileItem: { fontSize: 14, marginVertical: 2, fontFamily: 'monospace' },
    todo: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#666' }
});
