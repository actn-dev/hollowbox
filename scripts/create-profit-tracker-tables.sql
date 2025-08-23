-- Create tables for profit tracking data
CREATE TABLE IF NOT EXISTS profit_tracker_wallets (
  id SERIAL PRIMARY KEY,
  address VARCHAR(56) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profit_tracker_snapshots (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(56) NOT NULL,
  current_balances JSONB DEFAULT '{}',
  total_hollowvox_sold DECIMAL(20, 7) DEFAULT 0,
  total_xlm_received DECIMAL(20, 7) DEFAULT 0,
  average_sell_price DECIMAL(20, 7) DEFAULT 0,
  estimated_profit DECIMAL(20, 7) DEFAULT 0,
  action_fund_allocation DECIMAL(20, 7) DEFAULT 0,
  impact_fund_allocation DECIMAL(20, 7) DEFAULT 0,
  total_liquidity_provided DECIMAL(20, 7) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  last_transaction_date VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_address) REFERENCES profit_tracker_wallets(address)
);

CREATE TABLE IF NOT EXISTS profit_tracker_transactions (
  id VARCHAR(64) PRIMARY KEY,
  wallet_address VARCHAR(56) NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'trade', 'payment', 'liquidity'
  hollowvox_amount DECIMAL(20, 7) DEFAULT 0,
  xlm_amount DECIMAL(20, 7) DEFAULT 0,
  price DECIMAL(20, 7) DEFAULT 0,
  issuer VARCHAR(56),
  counterparty VARCHAR(56),
  pool_shares DECIMAL(20, 7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_address) REFERENCES profit_tracker_wallets(address)
);

-- Insert default wallet configurations
INSERT INTO profit_tracker_wallets (address, name, color, description) VALUES
('GC3XYCFXLX26RS34VMEZNVOMWXHBQ3AKPVPAEKK3OSRHB4X56CPXTU52', 'Primary Sales Wallet', '#00ff76', 'Main HOLLOWVOX token distribution wallet'),
('GAALODFU5N247F4GQMOSBSZWDYFA3VUBFUU4OCO6YTPPA4HM66VSEXZA', 'Secondary Sales Wallet', '#ff6b00', 'Additional HOLLOWVOX token sales wallet + Liquidity Provider')
ON CONFLICT (address) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profit_snapshots_wallet ON profit_tracker_snapshots(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profit_transactions_wallet ON profit_tracker_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profit_transactions_date ON profit_tracker_transactions(transaction_date);
