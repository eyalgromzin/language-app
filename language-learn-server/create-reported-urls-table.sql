-- Create reported_urls table
CREATE TABLE IF NOT EXISTS reported_urls (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL UNIQUE,
    count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS IDX_REPORTED_URLS_COUNT ON reported_urls(count DESC);
CREATE INDEX IF NOT EXISTS IDX_REPORTED_URLS_UPDATED ON reported_urls(updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS IDX_REPORTED_URLS_URL ON reported_urls(url);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reported_urls_updated_at 
    BEFORE UPDATE ON reported_urls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
