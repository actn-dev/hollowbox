-- Check if the column "tokens_owed" exists in any tables
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'tokens_owed';

-- Check if any views reference the column "tokens_owed"
SELECT table_name, view_definition
FROM information_schema.views
WHERE view_definition LIKE '%tokens_owed%';

-- Check if any triggers reference the column "tokens_owed"
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%tokens_owed%';
