# Applying Migrations to Supabase

## Manual Application (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pcxzyzkjjozroyneixxa/sql/new

2. Open the migration file you want to apply (e.g., `migrations/002_add_project_files.sql`)

3. Copy the entire SQL content

4. Paste it into the SQL Editor in Supabase Dashboard

5. Click "Run" to execute the migration

## Current Pending Migrations

- ✅ `001_initial_schema.sql` - Applied
- ⏳ `002_add_project_files.sql` - **Needs to be applied**

## Verification

After applying `002_add_project_files.sql`, verify by running:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'project_files';
```

You should see the `project_files` table listed.
