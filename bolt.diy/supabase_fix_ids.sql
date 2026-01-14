-- Run this to fix the "invalid input syntax for type uuid" error
-- We need to change IDs to TEXT because AI SDK generates alphanumeric IDs (not UUIDs)

-- 1. Drop foreign key constraint temporarily
alter table fragments drop constraint if exists fragments_message_id_fkey;

-- 2. Change column types to TEXT
alter table messages alter column id type text;
alter table fragments alter column message_id type text;
alter table plan_tickets alter column id type text;

-- 3. Restore foreign key constraint
alter table fragments add constraint fragments_message_id_fkey 
foreign key (message_id) references messages(id) on delete cascade;
