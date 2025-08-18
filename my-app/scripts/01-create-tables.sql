-- Creating database schema for forklift management system

-- Table for forklift units
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    unit_number VARCHAR(50) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    current_hours INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    purchase_date DATE,
    last_service_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for maintenance schedules
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(20) NOT NULL CHECK (maintenance_type IN ('250h', '500h', '750h', '1000h', '2000h', '3000h')),
    scheduled_hours INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    next_service_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for services (preventive and corrective)
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('preventive', 'corrective')),
    service_hours INTEGER NOT NULL,
    description TEXT NOT NULL,
    cost_usd DECIMAL(10,2) DEFAULT 0,
    technician VARCHAR(100),
    parts_used TEXT,
    service_date DATE NOT NULL,
    maintenance_type VARCHAR(20), -- For preventive maintenance (250h, 500h, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for fuel consumption
CREATE TABLE IF NOT EXISTS fuel_consumption (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
    period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    fuel_consumed_liters DECIMAL(8,2) NOT NULL,
    hours_operated INTEGER NOT NULL,
    fuel_efficiency DECIMAL(6,3) GENERATED ALWAYS AS (
        CASE 
            WHEN hours_operated > 0 THEN fuel_consumed_liters / hours_operated
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for anomaly reports
CREATE TABLE IF NOT EXISTS anomaly_reports (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES units(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    reported_by VARCHAR(100) NOT NULL,
    anomaly_description TEXT NOT NULL,
    severity VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    resolution_description TEXT,
    resolved_at TIMESTAMP,
    estimated_cost_usd DECIMAL(10,2),
    actual_cost_usd DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_unit_completed ON maintenance_schedules(unit_id, completed);
CREATE INDEX IF NOT EXISTS idx_services_unit_date ON services(unit_id, service_date);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_unit_period ON fuel_consumption(unit_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_anomaly_reports_unit_status ON anomaly_reports(unit_id, status);
