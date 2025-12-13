# Design Sessions Migration Instructions

This guide will help you set up the `design_sessions` tables in your Supabase database.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20241207_design_sessions.sql`
5. Click **Run** to execute the migration
6. Verify the tables were created by checking the **Table Editor**

Expected tables:
- `design_sessions` - Stores user design wizard sessions
- `design_session_screens` - Stores individual screen mockups
- `design_session_history` - Audit log of actions

## Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

## Option 3: Using Node Script

We've created a helper script to run the migration:

```bash
# Make sure you have the SUPABASE_SERVICE_ROLE_KEY in your .env.local
# Then run:
npm run migrate
```

## Verify Migration

After running the migration, verify it worked:

1. Check that tables exist:
   - `design_sessions`
   - `design_session_screens`
   - `design_session_history`

2. Check that the storage bucket exists:
   - `design-assets`

3. Test the RLS policies by trying to create a design session through the app

## What This Migration Creates

### Tables

**design_sessions**
- Stores user design wizard sessions with app metadata, style preferences, and generated assets
- Includes package selection and AI configuration

**design_session_screens**
- Individual screen mockups generated during the wizard process
- Links to parent design session

**design_session_history**
- Audit log of actions performed during the design session
- Tracks stage completions, screen generations, etc.

### Storage

**design-assets bucket**
- Public bucket for storing generated assets
- Organized by user_id and session_id
- Includes logos, screens, reference images, and generated code

### Functions

**get_user_design_sessions(p_user_id)**
- Helper function to list all design sessions for a user

**get_design_session_with_screens(p_session_id, p_user_id)**
- Helper function to get a session with all its screens

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own design sessions
- Storage policies ensure users can only access their own assets
- Public read access to design-assets bucket (for sharing)

## Troubleshooting

### Error: "relation already exists"
This is fine - it means the tables are already created. The migration is safe to run multiple times.

### Error: "permission denied"
Make sure you're using the service role key (has admin access) or run via Supabase dashboard.

### Storage bucket not created
If the storage bucket creation fails, create it manually:
1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Name it `design-assets`
4. Make it **Public**

## Next Steps

After the migration is complete:

1. Test creating a design session in the wizard
2. Verify data is saved to `design_sessions` table
3. Test package selection and AI configuration
4. Ensure screens are saved to `design_session_screens` table
