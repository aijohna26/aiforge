import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('📦 Running design_sessions migration...\n');

        const migrationPath = join(process.cwd(), 'supabase/migrations/20241207_design_sessions.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let skipCount = 0;

        for (const statement of statements) {
            try {
                const { error } = await supabase.rpc('exec_sql', { sql: statement });

                if (error) {
                    // Check if it's a "already exists" error, which we can safely ignore
                    if (error.message.includes('already exists')) {
                        console.log(`⏭️  Skipped (already exists): ${statement.substring(0, 60)}...`);
                        skipCount++;
                    } else {
                        console.error(`❌ Error executing statement: ${error.message}`);
                        console.error(`   Statement: ${statement.substring(0, 100)}...`);
                    }
                } else {
                    console.log(`✅ Executed: ${statement.substring(0, 60)}...`);
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ Error:`, err);
            }
        }

        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Executed: ${successCount} statements`);
        console.log(`   ⏭️  Skipped: ${skipCount} statements`);
        console.log(`\n✨ Migration complete!`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
