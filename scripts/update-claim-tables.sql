-- Add entries column to user_claims table
ALTER TABLE user_claims ADD COLUMN IF NOT EXISTS entries INTEGER NOT NULL DEFAULT 1;

-- Update existing claims to have 1 entry
UPDATE user_claims SET entries = 1 WHERE entries IS NULL OR entries = 0;

-- Update sample data to reflect drawing system
UPDATE claimable_items SET 
  description = 'Enter drawing for exclusive collection of HOLLOWVOX digital artwork and wallpapers'
WHERE title = 'HOLLOWVOX Digital Art Pack';

UPDATE claimable_items SET 
  description = 'Enter drawing for set of 10 premium vinyl stickers with HOLLOWVOX branding'
WHERE title = 'Limited Edition HOLLOWVOX Stickers';

UPDATE claimable_items SET 
  description = 'Enter drawing for premium quality hoodie with embroidered HOLLOWVOX logo'
WHERE title = 'HOLLOWVOX Hoodie';

UPDATE claimable_items SET 
  description = 'Enter drawing for exclusive access to VIP channels in the HOLLOWVOX Discord server'
WHERE title = 'VIP Discord Access';

UPDATE claimable_items SET 
  description = 'Enter drawing for personal 30-minute video call with HOLLOWVOX creator Jose Urquiza'
WHERE title = '1-on-1 Call with Jose';

UPDATE claimable_items SET 
  description = 'Enter drawing for exclusive NFT collection only available to token holders'
WHERE title = 'HOLLOWVOX NFT Collection';
