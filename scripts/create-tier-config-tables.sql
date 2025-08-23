-- Create tier configuration table
CREATE TABLE IF NOT EXISTS tier_config (
  id SERIAL PRIMARY KEY,
  tier_level INTEGER NOT NULL UNIQUE,
  tier_name VARCHAR(100) NOT NULL,
  token_requirement BIGINT NOT NULL,
  tier_color VARCHAR(50) NOT NULL DEFAULT 'text-gray-400',
  tier_bg_color VARCHAR(50) NOT NULL DEFAULT 'bg-gray-400/10',
  tier_border_color VARCHAR(50) NOT NULL DEFAULT 'border-gray-400/20',
  tier_icon VARCHAR(50) NOT NULL DEFAULT 'Circle',
  benefits TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clear existing data to avoid conflicts
DELETE FROM tier_config;

-- Insert reversed tier configurations (Tier 1 = Highest, Tier 3 = Lowest)
INSERT INTO tier_config (tier_level, tier_name, token_requirement, tier_color, tier_bg_color, tier_border_color, tier_icon, benefits) VALUES
(1, 'Void Walker', 50000000, 'text-purple-400', 'bg-purple-400/10', 'border-purple-400/20', 'Crown', ARRAY[
  'All previous tier benefits',
  'Developer API access',
  'Governance voting rights',
  'Exclusive NFT drops',
  'Beta testing access',
  'Direct developer contact',
  'Revenue sharing program'
]),
(2, 'Deep Hollower', 10000000, 'text-blue-400', 'bg-blue-400/10', 'border-blue-400/20', 'Star', ARRAY[
  'All Tier 3 benefits',
  'Priority support',
  'Exclusive events access',
  'Early feature previews',
  'Monthly community calls',
  'Special Discord channels'
]),
(3, 'Hollower', 1000000, 'text-green-400', 'bg-green-400/10', 'border-green-400/20', 'Circle', ARRAY[
  'Access to The Hollow community',
  'Discord member role',
  'Newsletter subscription',
  'Profile badge',
  'Basic support'
]);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tier_config_level ON tier_config(tier_level);
CREATE INDEX IF NOT EXISTS idx_tier_config_active ON tier_config(is_active);
