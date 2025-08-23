-- Create watchlist table for storing monitored wallet addresses
CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  wallet VARCHAR(56) NOT NULL UNIQUE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('passive', 'active')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_watchlist_wallet ON watchlist(wallet);
CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist(status);
CREATE INDEX IF NOT EXISTS idx_watchlist_updated_at ON watchlist(updated_at);

-- Create suspicious_logs table for storing activity logs
CREATE TABLE IF NOT EXISTS suspicious_logs (
  id SERIAL PRIMARY KEY,
  wallet VARCHAR(56) NOT NULL,
  type VARCHAR(50) NOT NULL,
  asset VARCHAR(50) NOT NULL,
  amount VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  transaction_hash VARCHAR(64) NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Create indexes for suspicious_logs
CREATE INDEX IF NOT EXISTS idx_suspicious_logs_wallet ON suspicious_logs(wallet);
CREATE INDEX IF NOT EXISTS idx_suspicious_logs_received_at ON suspicious_logs(received_at);
CREATE INDEX IF NOT EXISTS idx_suspicious_logs_processed ON suspicious_logs(processed);
