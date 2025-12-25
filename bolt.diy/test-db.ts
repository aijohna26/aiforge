import { createClient } from './app/lib/supabase/server';

async function testConnection() {
    const headers = new Headers();
    const request = new Request('http://localhost');
    const supabase = createClient(request, headers);

    console.log('Testing connection to studio_workspaces...');
    const { error } = await supabase.from('studio_workspaces').select('id').limit(1);

    if (error) {
        if (error.code === '42P01') {
            console.error('TABLE MISSING: studio_workspaces does not exist.');
        } else {
            console.error('DB ERROR:', error.message);
        }
    } else {
        console.log('SUCCESS: studio_workspaces table exists and is accessible.');
    }
}

testConnection();
