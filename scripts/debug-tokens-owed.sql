-- Check if there are any views that might be using tokens_owed
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name LIKE '%tokens_owed%';

-- Check the actual structure of wallet_rewards_balance
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallet_rewards_balance';

-- Check if there are any triggers on the tables
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('wallet_rewards_balance', 'game_rewards', 'reward_claims');

-- Check if there are any views that reference tokens_owed
SELECT table_name, view_definition
FROM information_schema.views
WHERE view_definition LIKE '%tokens_owed%';
