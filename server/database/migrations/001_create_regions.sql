-- Migration: 001_create_regions.sql
-- Create regions table

CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ua VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    geometry JSONB,
    population INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_regions_code ON regions(code);
CREATE INDEX IF NOT EXISTS idx_regions_name ON regions(name);

-- Add comment
COMMENT ON TABLE regions IS 'Ukrainian regions (oblasts) for environmental data aggregation';