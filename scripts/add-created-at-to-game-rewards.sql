-- Add missing columns to game_rewards table
DO $$ 
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'game_rewards' AND column_name = 'created_at') THEN
        ALTER TABLE game_rewards ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update existing rows to have a created_at value
        UPDATE game_rewards SET created_at = NOW() WHERE created_at IS NULL;
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'game_rewards' AND column_name = 'metadata') THEN
        ALTER TABLE game_rewards ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Create indexes for better performance
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'game_rewards' AND column_name = 'game_type') THEN
        CREATE INDEX IF NOT EXISTS idx_game_rewards_wallet_game_type_created 
        ON game_rewards(wallet_address, game_type, created_at);
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_game_rewards_created_at 
    ON game_rewards(created_at);
    
END $$;
