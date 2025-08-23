-- Add expiration date and winner announcement columns to claimable_items table
ALTER TABLE claimable_items 
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS winner_announced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS winner_announced_at TIMESTAMP WITH TIME ZONE;

-- Create index for expiration date queries
CREATE INDEX IF NOT EXISTS idx_claimable_items_expiration ON claimable_items(expiration_date);

-- Create index for winner announcement queries
CREATE INDEX IF NOT EXISTS idx_claimable_items_winner_announced ON claimable_items(winner_announced);

-- Update existing items to have winner_announced = false if null
UPDATE claimable_items SET winner_announced = FALSE WHERE winner_announced IS NULL;
