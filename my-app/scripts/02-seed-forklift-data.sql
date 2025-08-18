-- Insert sample units
INSERT INTO units (unit_number, brand, model, serial_number, year, capacity_kg, fuel_type, current_hours, status, location, purchase_date, purchase_cost, notes) VALUES
('FL-001', 'Toyota', '8FGU25', 'TY2024001', 2024, 2500, 'diesel', 1250, 'active', 'Warehouse A', '2024-01-15', 45000.00, 'Primary warehouse forklift'),
('FL-002', 'Caterpillar', 'GP25N', 'CAT2023002', 2023, 2500, 'diesel', 2100, 'active', 'Warehouse B', '2023-06-20', 42000.00, 'Heavy duty operations'),
('FL-003', 'Hyster', 'H2.5FT', 'HY2023003', 2023, 2500, 'diesel', 1800, 'active', 'Loading Dock', '2023-03-10', 38000.00, 'Loading dock operations'),
('FL-004', 'Yale', 'GDP25VX', 'YL2022004', 2022, 2500, 'diesel', 3200, 'maintenance', 'Workshop', '2022-08-15', 40000.00, 'Currently in maintenance'),
('FL-005', 'Komatsu', 'FG25T-16', 'KM2024005', 2024, 2500, 'diesel', 800, 'active', 'Warehouse C', '2024-02-28', 44000.00, 'Newest addition to fleet');

-- Insert maintenance schedules
INSERT INTO maintenance_schedules (unit_id, maintenance_type, interval_hours, last_service_hours, next_service_hours, status, description, estimated_cost) VALUES
((SELECT id FROM units WHERE unit_number = 'FL-001'), 'preventive', 250, 1000, 1250, 'overdue', 'Basic maintenance - oil change, filters', 350.00),
((SELECT id FROM units WHERE unit_number = 'FL-001'), 'preventive', 500, 1000, 1500, 'pending', 'Intermediate maintenance - hydraulic system check', 750.00),
((SELECT id FROM units WHERE unit_number = 'FL-002'), 'preventive', 250, 2000, 2250, 'pending', 'Basic maintenance - oil change, filters', 350.00),
((SELECT id FROM units WHERE unit_number = 'FL-003'), 'preventive', 250, 1750, 2000, 'pending', 'Basic maintenance - oil change, filters', 350.00),
((SELECT id FROM units WHERE unit_number = 'FL-004'), 'preventive', 1000, 3000, 4000, 'pending', 'Major maintenance - engine overhaul', 2500.00),
((SELECT id FROM units WHERE unit_number = 'FL-005'), 'preventive', 250, 750, 1000, 'pending', 'Basic maintenance - oil change, filters', 350.00);

-- Insert service history
INSERT INTO services (unit_id, service_type, service_date, hours_at_service, technician, description, parts_used, labor_hours, parts_cost, labor_cost, total_cost, downtime_hours, severity, status, notes) VALUES
((SELECT id FROM units WHERE unit_number = 'FL-001'), 'preventive', '2024-11-15', 1000, 'Carlos Rodriguez', 'Routine maintenance - oil change, air filter replacement', 'Engine oil (5L), Air filter, Oil filter', 2.5, 85.00, 125.00, 210.00, 3, 'low', 'completed', 'All systems functioning normally'),
((SELECT id FROM units WHERE unit_number = 'FL-002'), 'corrective', '2024-11-20', 2000, 'Miguel Santos', 'Hydraulic leak repair', 'Hydraulic seals, Hydraulic fluid (2L)', 4.0, 150.00, 200.00, 350.00, 6, 'medium', 'completed', 'Leak in main cylinder repaired'),
((SELECT id FROM units WHERE unit_number = 'FL-003'), 'preventive', '2024-11-10', 1750, 'Ana Martinez', 'Scheduled maintenance', 'Engine oil (5L), Fuel filter, Hydraulic fluid (1L)', 3.0, 95.00, 150.00, 245.00, 4, 'low', 'completed', 'Preventive maintenance completed'),
((SELECT id FROM units WHERE unit_number = 'FL-004'), 'corrective', '2024-11-25', 3000, 'Carlos Rodriguez', 'Engine overhaul', 'Piston rings, Gaskets, Engine oil (8L)', 16.0, 1200.00, 800.00, 2000.00, 48, 'high', 'completed', 'Major engine repair completed'),
((SELECT id FROM units WHERE unit_number = 'FL-005'), 'preventive', '2024-11-18', 750, 'Miguel Santos', 'First service', 'Engine oil (5L), Oil filter', 2.0, 65.00, 100.00, 165.00, 2, 'low', 'completed', 'Initial service for new unit');

-- Insert fuel consumption data
INSERT INTO fuel_consumption (unit_id, period_start, period_end, period_type, fuel_consumed_liters, hours_operated, efficiency_lph, fuel_cost_usd, notes) VALUES
((SELECT id FROM units WHERE unit_number = 'FL-001'), '2024-11-01', '2024-11-07', 'weekly', 180.5, 45.0, 4.01, 216.60, 'Normal operations'),
((SELECT id FROM units WHERE unit_number = 'FL-001'), '2024-11-08', '2024-11-14', 'weekly', 195.2, 48.5, 4.02, 234.24, 'Heavy load week'),
((SELECT id FROM units WHERE unit_number = 'FL-002'), '2024-11-01', '2024-11-07', 'weekly', 210.8, 50.0, 4.22, 253.00, 'Continuous operations'),
((SELECT id FROM units WHERE unit_number = 'FL-002'), '2024-11-08', '2024-11-14', 'weekly', 198.5, 47.5, 4.18, 238.20, 'Standard operations'),
((SELECT id FROM units WHERE unit_number = 'FL-003'), '2024-11-01', '2024-11-30', 'monthly', 850.0, 200.0, 4.25, 1020.00, 'Monthly consumption - loading dock'),
((SELECT id FROM units WHERE unit_number = 'FL-005'), '2024-11-01', '2024-11-30', 'monthly', 320.5, 80.0, 4.01, 384.60, 'New unit - break-in period');

-- Insert anomaly reports
INSERT INTO anomaly_reports (unit_id, report_date, reported_by, anomaly_type, severity, description, immediate_action, estimated_repair_cost, status, resolution_date, resolution_notes, actual_repair_cost) VALUES
((SELECT id FROM units WHERE unit_number = 'FL-001'), '2024-12-01', 'Juan Perez', 'hydraulic', 'low', 'Slight hydraulic fluid leak noticed under unit', 'Added hydraulic fluid, monitoring situation', 200.00, 'open', NULL, NULL, NULL),
((SELECT id FROM units WHERE unit_number = 'FL-002'), '2024-11-28', 'Maria Garcia', 'mechanical', 'medium', 'Unusual noise from transmission during operation', 'Reduced operating hours, scheduled inspection', 800.00, 'in_progress', NULL, NULL, NULL),
((SELECT id FROM units WHERE unit_number = 'FL-003'), '2024-11-25', 'Pedro Lopez', 'electrical', 'high', 'Warning lights intermittently flashing on dashboard', 'Unit taken out of service immediately', 500.00, 'resolved', '2024-11-27', 'Faulty sensor replaced, all systems normal', 450.00),
((SELECT id FROM units WHERE unit_number = 'FL-004'), '2024-11-20', 'Carlos Rodriguez', 'mechanical', 'critical', 'Engine overheating and loss of power', 'Unit shut down immediately, towed to workshop', 2000.00, 'resolved', '2024-11-25', 'Engine overhaul completed, cooling system repaired', 2000.00),
((SELECT id FROM units WHERE unit_number = 'FL-005'), '2024-12-02', 'Ana Martinez', 'other', 'low', 'Seat adjustment mechanism not working properly', 'Operator using cushion as temporary fix', 150.00, 'open', NULL, NULL, NULL);
