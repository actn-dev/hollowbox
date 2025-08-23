-- Create table for tracking daily signal catching limits
CREATE TABLE IF NOT EXISTS signal_hunt_daily_limits (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  date DATE NOT NULL,
  tokens_earned INTEGER DEFAULT 0,
  last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet_address, date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_signal_hunt_daily_limits_wallet_date 
ON signal_hunt_daily_limits(wallet_address, date);
