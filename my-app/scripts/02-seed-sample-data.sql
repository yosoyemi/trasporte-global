-- Adding sample data for testing the forklift management system

-- Insert sample forklift units
INSERT INTO units (unit_number, brand, model, serial_number, current_hours, purchase_date) VALUES
('FL-001', 'Toyota', '8FGU25', 'TY2023001', 1250, '2023-01-15'),
('FL-002', 'Caterpillar', 'GP25N', 'CAT2023002', 890, '2023-03-20'),
('FL-003', 'Hyster', 'H2.5FT', 'HY2023003', 2100, '2022-11-10'),
('FL-004', 'Yale', 'GLP025VX', 'YL2023004', 450, '2023-08-05'),
('FL-005', 'Crown', 'FC5200', 'CR2023005', 1800, '2022-12-18');

-- Insert maintenance schedules
INSERT INTO maintenance_schedules (unit_id, maintenance_type, scheduled_hours, next_service_hours) VALUES
(1, '250h', 1250, 1500),
(1, '500h', 1500, 2000),
(2, '250h', 1000, 1250),
(3, '500h', 2000, 2500),
(3, '1000h', 2000, 3000),
(4, '250h', 500, 750),
(5, '500h', 2000, 2500);

-- Insert sample services
INSERT INTO services (unit_id, service_type, service_hours, description, cost_usd, service_date, maintenance_type) VALUES
(1, 'preventive', 1000, 'Cambio de aceite, filtros y revisión general', 285.50, '2024-01-15', '1000h'),
(2, 'corrective', 850, 'Reparación de sistema hidráulico - fuga en cilindro principal', 450.75, '2024-01-20', NULL),
(3, 'preventive', 1500, 'Mantenimiento 1500h - cambio de aceite, filtros, revisión de frenos', 320.00, '2024-02-01', '1500h'),
(1, 'corrective', 1200, 'Cambio de llantas traseras por desgaste excesivo', 180.25, '2024-02-10', NULL),
(4, 'preventive', 250, 'Primer mantenimiento preventivo - aceite y filtros', 150.00, '2024-02-15', '250h');

-- Insert fuel consumption records
INSERT INTO fuel_consumption (unit_id, period_type, period_start, period_end, fuel_consumed_liters, hours_operated) VALUES
(1, 'weekly', '2024-01-01', '2024-01-07', 45.5, 35),
(1, 'weekly', '2024-01-08', '2024-01-14', 52.3, 40),
(2, 'weekly', '2024-01-01', '2024-01-07', 38.2, 28),
(3, 'monthly', '2024-01-01', '2024-01-31', 180.5, 145),
(4, 'weekly', '2024-01-15', '2024-01-21', 25.8, 20),
(5, 'monthly', '2024-01-01', '2024-01-31', 195.2, 160);

-- Insert anomaly reports
INSERT INTO anomaly_reports (unit_id, report_date, reported_by, anomaly_description, severity, status, estimated_cost_usd) VALUES
(1, '2024-01-25', 'Juan Pérez', 'Ruido extraño en el motor al acelerar, posible problema en la transmisión', 'medium', 'open', 300.00),
(2, '2024-01-28', 'María González', 'Fuga de aceite hidráulico en el área del mástil', 'high', 'in_progress', 500.00),
(3, '2024-02-02', 'Carlos Rodríguez', 'Frenos traseros con respuesta lenta, requiere revisión urgente', 'high', 'resolved', 250.00),
(4, '2024-02-05', 'Ana López', 'Luces de trabajo intermitentes, posible problema eléctrico', 'low', 'open', 80.00),
(5, '2024-02-08', 'Roberto Silva', 'Vibración excesiva en el volante durante operación', 'medium', 'open', 200.00);
