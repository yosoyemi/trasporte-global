-- Create units table for forklift information
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_number VARCHAR(50) UNIQUE NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  year INTEGER,
  capacity_kg INTEGER,
  fuel_type VARCHAR(50) DEFAULT 'diesel',
  current_hours INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  location VARCHAR(200),
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_schedules table
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL, -- 'preventive' or 'corrective'
  interval_hours INTEGER NOT NULL, -- 250, 500, 750, 1000, 2000, 3000
  last_service_hours INTEGER DEFAULT 0,
  next_service_hours INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'overdue', 'completed'
  description TEXT,
  estimated_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table for completed maintenance
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL, -- 'preventive', 'corrective', 'emergency'
  service_date DATE NOT NULL,
  hours_at_service INTEGER NOT NULL,
  technician VARCHAR(200),
  description TEXT NOT NULL,
  parts_used TEXT,
  labor_hours DECIMAL(5,2),
  parts_cost DECIMAL(10,2) DEFAULT 0,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  downtime_hours INTEGER DEFAULT 0,
  severity VARCHAR(50) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fuel_consumption table
CREATE TABLE IF NOT EXISTS fuel_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL, -- 'weekly', 'monthly'
  fuel_consumed_liters DECIMAL(8,2) NOT NULL,
  hours_operated DECIMAL(8,2) NOT NULL,
  efficiency_lph DECIMAL(6,3), -- liters per hour
  fuel_cost_usd DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anomaly_reports table
CREATE TABLE IF NOT EXISTS anomaly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  reported_by VARCHAR(200),
  anomaly_type VARCHAR(100), -- 'mechanical', 'electrical', 'hydraulic', 'other'
  severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  immediate_action TEXT,
  estimated_repair_cost DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  resolution_date DATE,
  resolution_notes TEXT,
  actual_repair_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_unit_number ON units(unit_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_unit_id ON maintenance_schedules(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_status ON maintenance_schedules(status);
CREATE INDEX IF NOT EXISTS idx_services_unit_id ON services(unit_id);
CREATE INDEX IF NOT EXISTS idx_services_service_date ON services(service_date);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_unit_id ON fuel_consumption(unit_id);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_period ON fuel_consumption(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_anomaly_reports_unit_id ON anomaly_reports(unit_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_reports_status ON anomaly_reports(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fuel_consumption_updated_at BEFORE UPDATE ON fuel_consumption FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anomaly_reports_updated_at BEFORE UPDATE ON anomaly_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
