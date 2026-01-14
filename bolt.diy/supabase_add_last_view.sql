-- Add last_view column to projects table to remember user stage
alter table projects add column if not exists last_view text;
