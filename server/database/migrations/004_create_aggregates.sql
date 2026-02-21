-- Migration: 004_create_regional_aggregates.sql
-- Create regional aggregates table for precomputed statistics

CREATE TABLE IF NOT EXISTS regional_aggregates (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    parameter VARCHAR(20) NOT NULL CHECK (parameter IN ('pm25', 'pm10', 'no2', 'co', 'o3', 'so2')),
    avg_value DECIMAL(10, 4),
    min_value DECIMAL(10, 4),
    max_value DECIMAL(10, 4),
    avg_aqi INTEGER,
    measurement_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_regional_aggregate UNIQUE (region_id, date, parameter)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_regional_agg_region_date ON regional_aggregates(region_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_regional_agg_parameter ON regional_aggregates(parameter);
CREATE INDEX IF NOT EXISTS idx_regional_agg_date ON regional_aggregates(date DESC);

-- Add comments
COMMENT ON TABLE regional_aggregates IS 'Daily aggregated air quality statistics by region';
COMMENT ON COLUMN regional_aggregates.date IS 'Aggregation date (daily)';
COMMENT ON COLUMN regional_aggregates.avg_value IS 'Average pollutant value for the day';
COMMENT ON COLUMN regional_aggregates.measurement_count IS 'Number of measurements used for aggregation';