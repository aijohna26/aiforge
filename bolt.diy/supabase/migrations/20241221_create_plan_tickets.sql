/*
  # Create plan_tickets table

  1. New Tables
    - `plan_tickets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `project_id` (text, for logical grouping)
      - `key` (text)
      - `title` (text)
      - `description` (text)
      - `type` (text)
      - `status` (text)
      - `priority` (text)
      - `acceptance_criteria` (jsonb)
      - `estimated_hours` (numeric)
      - `assigned_to` (text)
      - `related_screens` (jsonb)
      - `related_data_models` (jsonb)
      - `dependencies` (jsonb)
      - `labels` (jsonb)
      - `parallel` (boolean)
      - `order_index` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `plan_tickets` table
    - Add policy for users to manage their own tickets
*/

CREATE TABLE IF NOT EXISTS plan_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id text NOT NULL,
    key text NOT NULL,
    title text NOT NULL,
    description text,
    type text NOT NULL DEFAULT 'task',
    status text NOT NULL DEFAULT 'todo',
    priority text NOT NULL DEFAULT 'medium',
    acceptance_criteria jsonb DEFAULT '[]'::jsonb,
    estimated_hours numeric,
    assigned_to text,
    related_screens jsonb DEFAULT '[]'::jsonb,
    related_data_models jsonb DEFAULT '[]'::jsonb,
    dependencies jsonb DEFAULT '[]'::jsonb,
    labels jsonb DEFAULT '[]'::jsonb,
    parallel boolean DEFAULT false,
    order_index integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE plan_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tickets"
    ON plan_tickets
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_plan_tickets_user_project ON plan_tickets(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_plan_tickets_status ON plan_tickets(status);
