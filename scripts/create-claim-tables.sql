-- Create tables for the claim system
CREATE TABLE IF NOT EXISTS claimable_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    tokens_required INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(50) NOT NULL DEFAULT 'digital',
    claims_remaining INTEGER NULL, -- NULL means unlimited
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_claims (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES claimable_items(id) ON DELETE CASCADE,
    wallet_address VARCHAR(56) NOT NULL, -- Stellar addresses are 56 characters
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_address TEXT, -- Shipping address for physical items
    user_phone VARCHAR(50),
    user_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_claimable_items_active ON claimable_items(is_active);
CREATE INDEX IF NOT EXISTS idx_claimable_items_category ON claimable_items(category);
CREATE INDEX IF NOT EXISTS idx_user_claims_wallet ON user_claims(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_claims_item ON user_claims(item_id);
CREATE INDEX IF NOT EXISTS idx_user_claims_status ON user_claims(status);

-- Insert some sample claimable items
INSERT INTO claimable_items (title, description, image_url, tokens_required, category, claims_remaining, is_active) VALUES
('HOLLOWVOX Digital Art Pack', 'Exclusive collection of HOLLOWVOX digital artwork and wallpapers', '/placeholder.svg?height=300&width=400', 500000, 'digital', NULL, true),
('Limited Edition HOLLOWVOX Stickers', 'Set of 10 premium vinyl stickers with HOLLOWVOX branding', '/placeholder.svg?height=300&width=400', 1000000, 'physical', 100, true),
('HOLLOWVOX Hoodie', 'Premium quality hoodie with embroidered HOLLOWVOX logo', '/placeholder.svg?height=300&width=400', 5000000, 'physical', 50, true),
('VIP Discord Access', 'Exclusive access to VIP channels in the HOLLOWVOX Discord server', '/placeholder.svg?height=300&width=400', 2000000, 'digital', NULL, true),
('1-on-1 Call with Jose', 'Personal 30-minute video call with HOLLOWVOX creator Jose Urquiza', '/placeholder.svg?height=300&width=400', 25000000, 'experience', 10, true),
('HOLLOWVOX NFT Collection', 'Exclusive NFT collection only available to token holders', '/placeholder.svg?height=300&width=400', 10000000, 'digital', 25, true);
