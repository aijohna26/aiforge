-- Run this query in your Supabase SQL Editor to find your previously saved screens.
-- The 'project_id' is extracted from your URL: 2abe9cd0-2d13-4295-a944-055126b42f28

SELECT 
    id, 
    project_id, 
    snapshot_hash, 
    jsonb_array_length(frames) as frame_count, 
    updated_at 
FROM studio_workspaces 
WHERE project_id = '2abe9cd0-2d13-4295-a944-055126b42f28' 
ORDER BY updated_at DESC;

/* 
INSTRUCTIONS:
1. Run the query above.
2. Look for a row with a high 'frame_count' (e.g. 15).
3. If you find it, copy the 'snapshot_hash'.
4. Let us know the hash, and we can help restore it.
*/
