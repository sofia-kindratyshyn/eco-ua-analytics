-- Migration: 002_create_stations.sql
-- Create stations table

CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    source VARCHAR(50) NOT NULL CHECK (source IN ('saveecobot', 'openaq', 'waqi')),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_external_station UNIQUE (external_id, source)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stations_region ON stations(region_id);
CREATE INDEX IF NOT EXISTS idx_stations_active ON stations(is_active);
CREATE INDEX IF NOT EXISTS idx_stations_source ON stations(source);
CREATE INDEX IF NOT EXISTS idx_stations_location ON stations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stations_external_id ON stations(external_id, source);

-- Add comment
COMMENT ON TABLE stations IS 'Air quality monitoring stations across Ukraine';
COMMENT ON COLUMN stations.external_id IS 'ID from external data source (SaveEcoBot, OpenAQ, etc.)';
COMMENT ON COLUMN stations.source IS 'Data source: saveecobot, openaq, or waqi';