-- Run this in your Supabase SQL Editor to add the missing column
alter table plan_tickets add column if not exists metadata jsonb;
