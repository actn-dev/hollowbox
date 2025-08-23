-- Create Signal Hunt game tables

-- Players table to track user stats
CREATE TABLE IF NOT EXISTS signal_hunt_players (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(56) UNIQUE NOT NULL,
    scans_used INTEGER DEFAULT 0,
    max_scans INTEGER DEFAULT 3,
    tokens_earned INTEGER DEFAULT 0,
    signals_found INTEGER DEFAULT 0,
    perfect_rhythms INTEGER DEFAULT 0,
    lore_unlocked INTEGER DEFAULT 0,
    last_scan_time TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Found signals table to track discovered signals
CREATE TABLE IF NOT EXISTS signal_hunt_found_signals (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(56) NOT NULL,
    signal_id VARCHAR(100) UNIQUE NOT NULL,
    signal_type VARCHAR(20) NOT NULL, -- 'rhythm', 'lore', 'token', 'rare'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    reward INTEGER NOT NULL,
    x_position DECIMAL(5,2) NOT NULL,
    y_position DECIMAL(5,2) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completion_score INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (wallet_address) REFERENCES signal_hunt_players(wallet_address) ON DELETE CASCADE
);

-- Completions table for leaderboard tracking
CREATE TABLE IF NOT EXISTS signal_hunt_completions (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(56) NOT NULL,
    signal_id VARCHAR(100) NOT NULL,
    signal_type VARCHAR(20) NOT NULL,
    score INTEGER NOT NULL,
    perfect BOOLEAN DEFAULT FALSE,
    tokens_earned INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (wallet_address) REFERENCES signal_hunt_players(wallet_address) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signal_hunt_players_wallet ON signal_hunt_players(wallet_address);
CREATE INDEX IF NOT EXISTS idx_signal_hunt_found_signals_wallet ON signal_hunt_found_signals(wallet_address);
CREATE INDEX IF NOT EXISTS idx_signal_hunt_found_signals_completed ON signal_hunt_found_signals(completed);
CREATE INDEX IF NOT EXISTS idx_signal_hunt_completions_wallet ON signal_hunt_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_signal_hunt_completions_date ON signal_hunt_completions(created_at);
CREATE INDEX IF NOT EXISTS idx_signal_hunt_completions_score ON signal_hunt_completions(score);

-- Function to reset daily scans (to be called by a cron job)
CREATE OR REPLACE FUNCTION reset_daily_scans()
RETURNS void AS $$
BEGIN
    UPDATE signal_hunt_players 
    SET scans_used = 0, 
        updated_at = NOW()
    WHERE scans_used > 0;
END;
$$ LANGUAGE plpgsql;
