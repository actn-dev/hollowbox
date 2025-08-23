-- Remove Signal Hunt tables and data

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS signal_hunt_completions CASCADE;
DROP TABLE IF EXISTS signal_hunt_found_signals CASCADE;
DROP TABLE IF EXISTS signal_hunt_players CASCADE;
DROP TABLE IF EXISTS signal_hunt_daily_limits CASCADE;
DROP TABLE IF EXISTS signal_hunt_stats CASCADE;

-- Drop any remaining functions
DROP FUNCTION IF EXISTS reset_daily_scans() CASCADE;

-- Clean up any signal hunt related game_rewards entries
DELETE FROM game_rewards WHERE game_type IN (
  'signal-hunt', 
  'signal-scan', 
  'signal-found', 
  'signal-catcher',
  'global-signal-catcher'
);

-- Remove any signal hunt related entries from other tables
-- (Add more cleanup as needed based on your database structure)
