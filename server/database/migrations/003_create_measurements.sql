-- Migration: 003_create_measurements.sql
-- Create measurements table

CREATE TABLE IF NOT EXISTS measurements (
    id BIGSERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    measured_at TIMESTAMP NOT NULL,
    parameter VARCHAR(20) NOT NULL CHECK (parameter IN ('pm25', 'pm10', 'no2', 'co', 'o3', 'so2')),
    value DECIMAL(10, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    aqi INTEGER CHECK (aqi >= 0 AND aqi <= 500),
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_measurement UNIQUE (station_id, measured_at, parameter)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_measurements_station_time ON measurements(station_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_time ON measurements(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_parameter ON measurements(parameter);
CREATE INDEX IF NOT EXISTS idx_measurements_station_param ON measurements(station_id, parameter, measured_at DESC);

-- Partitioning hint for future (when data grows)
-- Consider partitioning by measured_at (monthly or yearly) when table grows beyond 10M rows

-- Add comments
COMMENT ON TABLE measurements IS 'Time-series air quality measurements from monitoring stations';
COMMENT ON COLUMN measurements.parameter IS 'Pollutant type: pm25, pm10, no2, co, o3, so2';
COMMENT ON COLUMN measurements.value IS 'Measurement value in specified unit';
COMMENT ON COLUMN measurements.aqi IS 'Air Quality Index (0-500)';