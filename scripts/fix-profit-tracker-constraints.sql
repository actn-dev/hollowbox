-- Add unique constraint to profit_tracker_snapshots table
-- This fixes the ON CONFLICT issue in the update route

-- First, remove any duplicate entries if they exist
DELETE FROM profit_tracker_snapshots 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM profit_tracker_snapshots 
    GROUP BY wallet_address
);

-- Add unique constraint on wallet_address
ALTER TABLE profit_tracker_snapshots 
ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profit_tracker_transactions_wallet_date 
ON profit_tracker_transactions(wallet_address, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_profit_tracker_snapshots_wallet 
ON profit_tracker_snapshots(wallet_address);
