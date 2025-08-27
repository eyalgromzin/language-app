-- Create now_playing table
CREATE TABLE IF NOT EXISTS now_playing (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    length VARCHAR(50),
    language_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS IDX_NOW_PLAYING_LANGUAGE_UPDATED ON now_playing(language_id, updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS IDX_NOW_PLAYING_URL ON now_playing(url);

-- Add foreign key constraint (assuming languages table exists)
-- ALTER TABLE now_playing ADD CONSTRAINT FK_NOW_PLAYING_LANGUAGE 
-- FOREIGN KEY (language_id) REFERENCES languages(id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_now_playing_updated_at 
    BEFORE UPDATE ON now_playing 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
