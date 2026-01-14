-- Script para insertar reportes de diciembre 2025 - MÚLTIPLES REPORTES POR DÍA
-- Base de datos: refrigeracioncyc
-- Tabla: reporte
-- Usando sensores reales: SEN001 (temperatura), SEN005 (humedad), SEN10 (voltaje)
-- Usando cuartos reales: CF06, CF10, CF12
-- Cada día tiene VARIOS reportes en DIFERENTES CUARTOS con DIFERENTES SENSORES

-- Reportes de Temperatura (Sensor SEN001) - VARIOS POR DÍA - Cada día en los 3 cuartos
INSERT INTO reporte (codigo, nombre, tipo_reporte, fecha_creacion, fecha_captura, fecha, activo, report_id, temperatura, voltaje, amperaje, humedad, presion_s, presion_e, aire, otro, puerta, codigo_sensor, codigo_cuarto) VALUES
-- DÍA 1 - 3 reportes temperatura (uno por cada cuarto)
('REP-TEMP-001', 'Reporte Temperatura Dic 01 CF06', 'temperatura', '2025-12-01 08:00:00', '2025-12-01 08:00:00', '2025-12-01', 1, 'RPT-001', 4.5, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-002', 'Reporte Temperatura Dic 01 CF10', 'temperatura', '2025-12-01 12:30:00', '2025-12-01 12:30:00', '2025-12-01', 1, 'RPT-002', 5.2, 218, 16, 78, 31, 36, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-003', 'Reporte Temperatura Dic 01 CF12', 'temperatura', '2025-12-01 16:45:00', '2025-12-01 16:45:00', '2025-12-01', 1, 'RPT-003', 3.8, 222, 14, 72, 29, 34, 0, 0, 0, 'SEN001', 'CF12'),
-- DÍA 2 - 3 reportes temperatura
('REP-TEMP-004', 'Reporte Temperatura Dic 02 CF06', 'temperatura', '2025-12-02 09:15:00', '2025-12-02 09:15:00', '2025-12-02', 1, 'RPT-004', 4.3, 219, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-005', 'Reporte Temperatura Dic 02 CF10', 'temperatura', '2025-12-02 13:20:00', '2025-12-02 13:20:00', '2025-12-02', 1, 'RPT-005', 5.0, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-006', 'Reporte Temperatura Dic 02 CF12', 'temperatura', '2025-12-02 17:40:00', '2025-12-02 17:40:00', '2025-12-02', 1, 'RPT-006', 4.7, 221, 15, 75, 31, 36, 0, 0, 0, 'SEN001', 'CF12'),
-- DÍA 3 - 3 reportes temperatura
('REP-TEMP-007', 'Reporte Temperatura Dic 03 CF06', 'temperatura', '2025-12-03 10:30:00', '2025-12-03 10:30:00', '2025-12-03', 1, 'RPT-007', 5.5, 219, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-008', 'Reporte Temperatura Dic 03 CF10', 'temperatura', '2025-12-03 14:00:00', '2025-12-03 14:00:00', '2025-12-03', 1, 'RPT-008', 4.1, 220, 14, 73, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-009', 'Reporte Temperatura Dic 03 CF12', 'temperatura', '2025-12-03 18:15:00', '2025-12-03 18:15:00', '2025-12-03', 1, 'RPT-009', 4.8, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
-- DÍA 4 - 3 reportes temperatura
('REP-TEMP-010', 'Reporte Temperatura Dic 04 CF06', 'temperatura', '2025-12-04 08:45:00', '2025-12-04 08:45:00', '2025-12-04', 1, 'RPT-010', 4.2, 220, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-011', 'Reporte Temperatura Dic 04 CF10', 'temperatura', '2025-12-04 12:20:00', '2025-12-04 12:20:00', '2025-12-04', 1, 'RPT-011', 5.7, 219, 16, 78, 31, 36, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-012', 'Reporte Temperatura Dic 04 CF12', 'temperatura', '2025-12-04 16:30:00', '2025-12-04 16:30:00', '2025-12-04', 1, 'RPT-012', 4.4, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
-- DÍA 5 - 3 reportes temperatura
('REP-TEMP-013', 'Reporte Temperatura Dic 05 CF06', 'temperatura', '2025-12-05 09:00:00', '2025-12-05 09:00:00', '2025-12-05', 1, 'RPT-013', 3.9, 221, 14, 72, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-014', 'Reporte Temperatura Dic 05 CF10', 'temperatura', '2025-12-05 13:15:00', '2025-12-05 13:15:00', '2025-12-05', 1, 'RPT-014', 4.8, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-029', 'Reporte Temperatura Dic 10 CF10', 'temperatura', '2025-12-10 12:15:00', '2025-12-10 12:15:00', '2025-12-10', 1, 'RPT-029', 4.6, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-030', 'Reporte Temperatura Dic 10 CF12', 'temperatura', '2025-12-10 16:30:00', '2025-12-10 16:30:00', '2025-12-10', 1, 'RPT-030', 4.8, 221, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-031', 'Reporte Temperatura Dic 11 CF06', 'temperatura', '2025-12-11 09:00:00', '2025-12-11 09:00:00', '2025-12-11', 1, 'RPT-031', 5.7, 219, 16, 78, 31, 36, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-032', 'Reporte Temperatura Dic 11 CF10', 'temperatura', '2025-12-11 13:20:00', '2025-12-11 13:20:00', '2025-12-11', 1, 'RPT-032', 5.5, 220, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-033', 'Reporte Temperatura Dic 11 CF12', 'temperatura', '2025-12-11 17:40:00', '2025-12-11 17:40:00', '2025-12-11', 1, 'RPT-033', 3.9, 221, 14, 72, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-034', 'Reporte Temperatura Dic 12 CF06', 'temperatura', '2025-12-12 08:30:00', '2025-12-12 08:30:00', '2025-12-12', 1, 'RPT-034', 4.4, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-035', 'Reporte Temperatura Dic 12 CF10', 'temperatura', '2025-12-12 12:45:00', '2025-12-12 12:45:00', '2025-12-12', 1, 'RPT-035', 4.0, 220, 15, 73, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-036', 'Reporte Temperatura Dic 12 CF12', 'temperatura', '2025-12-12 17:00:00', '2025-12-12 17:00:00', '2025-12-12', 1, 'RPT-036', 5.3, 219, 16, 76, 31, 36, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-037', 'Reporte Temperatura Dic 13 CF06', 'temperatura', '2025-12-13 09:15:00', '2025-12-13 09:15:00', '2025-12-13', 1, 'RPT-037', 4.6, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-038', 'Reporte Temperatura Dic 13 CF10', 'temperatura', '2025-12-13 13:30:00', '2025-12-13 13:30:00', '2025-12-13', 1, 'RPT-038', 5.8, 217, 16, 79, 31, 36, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-039', 'Reporte Temperatura Dic 13 CF12', 'temperatura', '2025-12-13 17:45:00', '2025-12-13 17:45:00', '2025-12-13', 1, 'RPT-039', 5.1, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-040', 'Reporte Temperatura Dic 14 CF06', 'temperatura', '2025-12-14 08:20:00', '2025-12-14 08:20:00', '2025-12-14', 1, 'RPT-040', 4.6, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-041', 'Reporte Temperatura Dic 14 CF10', 'temperatura', '2025-12-14 12:35:00', '2025-12-14 12:35:00', '2025-12-14', 1, 'RPT-041', 4.8, 221, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-042', 'Reporte Temperatura Dic 14 CF12', 'temperatura', '2025-12-14 16:50:00', '2025-12-14 16:50:00', '2025-12-14', 1, 'RPT-042', 5.3, 219, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-043', 'Reporte Temperatura Dic 15 CF06', 'temperatura', '2025-12-15 09:05:00', '2025-12-15 09:05:00', '2025-12-15', 1, 'RPT-043', 5.0, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-044', 'Reporte Temperatura Dic 15 CF10', 'temperatura', '2025-12-15 13:20:00', '2025-12-15 13:20:00', '2025-12-15', 1, 'RPT-044', 4.7, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-045', 'Reporte Temperatura Dic 15 CF12', 'temperatura', '2025-12-15 17:35:00', '2025-12-15 17:35:00', '2025-12-15', 1, 'RPT-045', 4.4, 221, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-046', 'Reporte Temperatura Dic 16 CF06', 'temperatura', '2025-12-16 08:50:00', '2025-12-16 08:50:00', '2025-12-16', 1, 'RPT-046', 5.2, 220, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-047', 'Reporte Temperatura Dic 16 CF10', 'temperatura', '2025-12-16 13:05:00', '2025-12-16 13:05:00', '2025-12-16', 1, 'RPT-047', 5.0, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-048', 'Reporte Temperatura Dic 16 CF12', 'temperatura', '2025-12-16 17:20:00', '2025-12-16 17:20:00', '2025-12-16', 1, 'RPT-048', 4.5, 219, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-049', 'Reporte Temperatura Dic 17 CF06', 'temperatura', '2025-12-17 09:35:00', '2025-12-17 09:35:00', '2025-12-17', 1, 'RPT-049', 4.7, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-050', 'Reporte Temperatura Dic 17 CF10', 'temperatura', '2025-12-17 13:50:00', '2025-12-17 13:50:00', '2025-12-17', 1, 'RPT-050', 5.5, 219, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-051', 'Reporte Temperatura Dic 17 CF12', 'temperatura', '2025-12-17 18:05:00', '2025-12-17 18:05:00', '2025-12-17', 1, 'RPT-051', 4.2, 220, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-052', 'Reporte Temperatura Dic 18 CF06', 'temperatura', '2025-12-18 08:40:00', '2025-12-18 08:40:00', '2025-12-18', 1, 'RPT-052', 4.9, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-053', 'Reporte Temperatura Dic 18 CF10', 'temperatura', '2025-12-18 12:55:00', '2025-12-18 12:55:00', '2025-12-18', 1, 'RPT-053', 5.8, 217, 16, 79, 31, 36, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-054', 'Reporte Temperatura Dic 18 CF12', 'temperatura', '2025-12-18 17:10:00', '2025-12-18 17:10:00', '2025-12-18', 1, 'RPT-054', 4.3, 219, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-055', 'Reporte Temperatura Dic 19 CF06', 'temperatura', '2025-12-19 09:25:00', '2025-12-19 09:25:00', '2025-12-19', 1, 'RPT-055', 5.1, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-056', 'Reporte Temperatura Dic 19 CF10', 'temperatura', '2025-12-19 13:40:00', '2025-12-19 13:40:00', '2025-12-19', 1, 'RPT-056', 4.6, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-057', 'Reporte Temperatura Dic 19 CF12', 'temperatura', '2025-12-19 17:55:00', '2025-12-19 17:55:00', '2025-12-19', 1, 'RPT-057', 4.8, 221, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-058', 'Reporte Temperatura Dic 20 CF06', 'temperatura', '2025-12-20 08:30:00', '2025-12-20 08:30:00', '2025-12-20', 1, 'RPT-058', 5.3, 219, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-059', 'Reporte Temperatura Dic 20 CF10', 'temperatura', '2025-12-20 12:45:00', '2025-12-20 12:45:00', '2025-12-20', 1, 'RPT-059', 5.0, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-060', 'Reporte Temperatura Dic 20 CF12', 'temperatura', '2025-12-20 17:00:00', '2025-12-20 17:00:00', '2025-12-20', 1, 'RPT-060', 4.7, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-061', 'Reporte Temperatura Dic 21 CF06', 'temperatura', '2025-12-21 09:15:00', '2025-12-21 09:15:00', '2025-12-21', 1, 'RPT-061', 4.4, 221, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-062', 'Reporte Temperatura Dic 21 CF10', 'temperatura', '2025-12-21 13:30:00', '2025-12-21 13:30:00', '2025-12-21', 1, 'RPT-062', 5.2, 220, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-063', 'Reporte Temperatura Dic 21 CF12', 'temperatura', '2025-12-21 17:45:00', '2025-12-21 17:45:00', '2025-12-21', 1, 'RPT-063', 5.0, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-064', 'Reporte Temperatura DicVARIOS POR DÍA - Cada día en los 3 cuartos
INSERT INTO reporte (codigo, nombre, tipo_reporte, fecha_creacion, fecha_captura, fecha, activo, report_id, humedad, temperatura, voltaje, amperaje, presion_s, presion_e, aire, otro, puerta, codigo_sensor, codigo_cuarto) VALUES
-- DÍA 1 - 3 reportes humedad
('REP-HUM-001', 'Reporte Humedad Dic 01 CF06', 'humedad', '2025-12-01 09:00:00', '2025-12-01 09:00:00', '2025-12-01', 1, 'RPT-088', 72, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-002', 'Reporte Humedad Dic 01 CF10', 'humedad', '2025-12-01 13:15:00', '2025-12-01 13:15:00', '2025-12-01', 1, 'RPT-089', 75, 5, 219, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-003', 'Reporte Humedad Dic 01 CF12', 'humedad', '2025-12-01 17:30:00', '2025-12-01 17:30:00', '2025-12-01', 1, 'RPT-090', 78, 5, 220, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF12'),
-- DÍA 2 - 3 reportes humedad
('REP-HUM-004', 'Reporte Humedad Dic 02 CF06', 'humedad', '2025-12-02 10:00:00', '2025-12-02 10:00:00', '2025-12-02', 1, 'RPT-091', 74, 5, 221, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-005', 'Reporte Humedad Dic 02 CF10', 'humedad', '2025-12-02 14:15:00', '2025-12-02 14:15:00', '2025-12-02', 1, 'RPT-092', 76, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-006', 'Reporte Humedad Dic 02 CF12', 'humedad', '2025-12-02 18:30:00', '2025-12-02 18:30:00', '2025-12-02', 1, 'RPT-093', 75, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF12'),
-- DÍA 3 - 3 reportes humedad
('REP-HUM-007', 'Reporte Humedad Dic 03 CF06', 'humedad', '2025-12-03 09:30:00', '2025-12-03 09:30:00', '2025-12-03', 1, 'RPT-094', 77, 5, 219, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-008', 'Reporte Humedad Dic 03 CF10', 'humedad', '2025-12-03 13:45:00', '2025-12-03 13:45:00', '2025-12-03', 1, 'RPT-095', 80, 5, 218, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-009', 'Reporte Humedad Dic 03 CF12', 'humedad', '2025-12-03 18:00:00', '2025-12-03 18:00:00', '2025-12-03', 1, 'RPT-096', 73, 5, 220, 15, 30, 3576, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-069', 'Reporte Temperatura Dic 23 CF12', 'temperatura', '2025-12-23 18:15:00', '2025-12-23 18:15:00', '2025-12-23', 1, 'RPT-069', 5.8, 217, 16, 79, 31, 36, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-070', 'Reporte Temperatura Dic 24 CF06', 'temperatura', '2025-12-24 08:30:00', '2025-12-24 08:30:00', '2025-12-24', 1, 'RPT-070', 4.3, 219, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-071', 'Reporte Temperatura Dic 24 CF10', 'temperatura', '2025-12-24 12:45:00', '2025-12-24 12:45:00', '2025-12-24', 1, 'RPT-071', 5.1, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-072', 'Reporte Temperatura Dic 24 CF12', 'temperatura', '2025-12-24 17:00:00', '2025-12-24 17:00:00', '2025-12-24', 1, 'RPT-072', 4.6, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-073', 'Reporte Temperatura Dic 25 CF06', 'temperatura', '2025-12-25 09:15:00', '2025-12-25 09:15:00', '2025-12-25', 1, 'RPT-073', 4.8, 221, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-074', 'Reporte Temperatura Dic 25 CF10', 'temperatura', '2025-12-25 13:30:00', '2025-12-25 13:30:00', '2025-12-25', 1, 'RPT-074', 5.3, 219, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-075', 'Reporte Temperatura Dic 25 CF12', 'temperatura', '2025-12-25 17:45:00', '2025-12-25 17:45:00', '2025-12-25', 1, 'RPT-075', 5.0, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-076', 'Reporte Temperatura Dic 26 CF06', 'temperatura', '2025-12-26 08:00:00', '2025-12-26 08:00:00', '2025-12-26', 1, 'RPT-076', 4.7, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-077', 'Reporte Temperatura Dic 26 CF10', 'temperatura', '2025-12-26 12:15:00', '2025-12-26 12:15:00', '2025-12-26', 1, 'RPT-077', 4.4, 221, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-078', 'Reporte Temperatura Dic 26 CF12', 'temperatura', '2025-12-26 16:30:00', '2025-12-26 16:30:00', '2025-12-26', 1, 'RPT-078', 5.2, 220, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-079', 'Reporte Temperatura Dic 27 CF06', 'temperatura', '2025-12-27 09:45:00', '2025-12-27 09:45:00', '2025-12-27', 1, 'RPT-079', 5.0, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-080', 'Reporte Temperatura Dic 27 CF10', 'temperatura', '2025-12-27 14:00:00', '2025-12-27 14:00:00', '2025-12-27', 1, 'RPT-080', 4.5, 219, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-081', 'Reporte Temperatura Dic 27 CF12', 'temperatura', '2025-12-27 18:15:00', '2025-12-27 18:15:00', '2025-12-27', 1, 'RPT-081', 4.7, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-082', 'Reporte Temperatura Dic 28 CF06', 'temperatura', '2025-12-28 08:30:00', '2025-12-28 08:30:00', '2025-12-28', 1, 'RPT-082', 5.5, 219, 16, 77, 31, 36, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-083', 'Reporte Temperatura Dic 28 CF10', 'temperatura', '2025-12-28 12:45:00', '2025-12-28 12:45:00', '2025-12-28', 1, 'RPT-083', 4.2, 220, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-084', 'Reporte Temperatura Dic 28 CF12', 'temperatura', '2025-12-28 17:00:00', '2025-12-28 17:00:00', '2025-12-28', 1, 'RPT-084', 4.9, 220, 15, 76, 30, 35, 0, 0, 0, 'SEN001', 'CF12'),
('REP-TEMP-085', 'Reporte Temperatura Dic 29 CF06', 'temperatura', '2025-12-29 09:15:00', '2025-12-29 09:15:00', '2025-12-29', 1, 'RPT-085', 5.8, 217, 16, 79, 31, 36, 0, 0, 0, 'SEN001', 'CF06'),
('REP-TEMP-086', 'Reporte Temperatura Dic 29 CF10', 'temperatura', '2025-12-29 13:30:00', '2025-12-29 13:30:00', '2025-12-29', 1, 'RPT-086', 4.3, 219, 15, 74, 30, 35, 0, 0, 0, 'SEN001', 'CF10'),
('REP-TEMP-087', 'Reporte Temperatura Dic 29 CF12', 'temperatura', '2025-12-29 17:45:00', '2025-12-29 17:45:00', '2025-12-29', 1, 'RPT-087', 4.7, 220, 15, 75, 30, 35, 0, 0, 0, 'SEN001', 'CF12');

-- Reportes de Humedad (Sensor SEN005) - VARIOS POR DÍA - Cada día en los 3 cuartos
INSERT INTO reporte (codigo, nombre, tipo_reporte, fecha_creacion, fecha_captura, fecha, activo, report_id, humedad, temperatura, voltaje, amperaje, presion_s, presion_e, aire, otro, puerta, codigo_sensor, codigo_cuarto) VALUES
('REP-HUM-001', 'Reporte Humedad Diciembre 01', 'humedad', '2025-12-01 13:00:00', '2025-12-01 13:00:00', '2025-12-01', 1, 'RPT-030', 72, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-002', 'Reporte Humedad Diciembre 02', 'humedad', '2025-12-02 14:15:00', '2025-12-02 14:15:00', '2025-12-02', 1, 'RPT-031', 75, 5, 219, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-003', 'Reporte Humedad Diciembre 03', 'humedad', '2025-12-03 15:30:00', '2025-12-03 15:30:00', '2025-12-03', 1, 'RPT-032', 78, 5, 220, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF12'),
('REP-HUM-004', 'Reporte Humedad Diciembre 04', 'humedad', '2025-12-04 13:45:00', '2025-12-04 13:45:00', '2025-12-04', 1, 'RPT-033', 74, 5, 221, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-005', 'Reporte Humedad Diciembre 05', 'humedad', '2025-12-05 14:00:00', '2025-12-05 14:00:00', '2025-12-05', 1, 'RPT-034', 76, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-006', 'Reporte Humedad Diciembre 06', 'humedad', '2025-12-06 15:15:00', '2025-12-06 15:15:00', '2025-12-06', 1, 'RPT-035', 75, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF12'),
('REP-HUM-007', 'Reporte Humedad Diciembre 07', 'humedad', '2025-12-07 13:30:00', '2025-12-07 13:30:00', '2025-12-07', 1, 'RPT-036', 77, 5, 219, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-008', 'Reporte Humedad Diciembre 08', 'humedad', '2025-12-08 14:45:00', '2025-12-08 14:45:00', '2025-12-08', 1, 'RPT-037', 80, 5, 218, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-009', 'Reporte Humedad Diciembre 09', 'humedad', '2025-12-09 13:20:00', '2025-12-09 13:20:00', '2025-12-09', 1, 'RPT-038', 73, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF12'),
('REP-HUM-010', 'Reporte Humedad Diciembre 10', 'humedad', '2025-12-10 14:10:00', '2025-12-10 14:10:00', '2025-12-10', 1, 'RPT-039', 75, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-011', 'Reporte Humedad Diciembre 11', 'humedad', '2025-12-11 15:25:00', '2025-12-11 15:25:00', '2025-12-11', 1, 'RPT-040', 74, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-012', 'Reporte Humedad Diciembre 12', 'humedad', '2025-12-12 13:40:00', '2025-12-12 13:40:00', '2025-12-12', 1, 'RPT-041', 76, 5, 219, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF12'),
('REP-HUM-013', 'Reporte Humedad Diciembre 13', 'humedad', '2025-12-13 14:20:00', '2025-12-13 14:20:00', '2025-12-13', 1, 'RPT-042', 77, 5, 221, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-014', 'Reporte Humedad Diciembre 14', 'humedad', '2025-12-14 15:00:00', '2025-12-14 15:00:00', '2025-12-14', 1, 'RPT-043', 75, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-015', 'Reporte Humedad Diciembre 15', 'humedad', '2025-12-15 13:15:00', '2025-12-15 13:15:00', '2025-12-15', 1, 'RPT-044', 74, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF12'),
('REP-HUM-016', 'Reporte Humedad Diciembre 16', 'humedad', '2025-12-16 14:30:00', '2025-12-16 14:30:00', '2025-12-16', 1, 'RPT-045', 76, 5, 220, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-017', 'Reporte Humedad Diciembre 17', 'humedad', '2025-12-17 15:45:00', '2025-12-17 15:45:00', '2025-12-17', 1, 'RPT-046', 78, 5, 219, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-018', 'Reporte Humedad Diciembre 18', 'humedad', '2025-12-18 13:00:00', '2025-12-18 13:00:00', '2025-12-18', 1, 'RPT-047', 75, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF12'),
('REP-HUM-019', 'Reporte Humedad Diciembre 19', 'humedad', '2025-12-19 14:15:00', '2025-12-19 14:15:00', '2025-12-19', 1, 'RPT-048', 74, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-020', 'Reporte Humedad Diciembre 20', 'humedad', '2025-12-20 15:30:00', '2025-12-20 15:30:00', '2025-12-20', 1, 'RPT-049', 76, 5, 221, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-021', 'Reporte Humedad Diciembre 21', 'humedad', '2025-12-21 13:45:00', '2025-12-21 13:45:00', '2025-12-21', 1, 'RPT-050', 73, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF12'),
('REP-HUM-022', 'Reporte Humedad Diciembre 22', 'humedad', '2025-12-22 14:00:00', '2025-12-22 14:00:00', '2025-12-22', 1, 'RPT-051', 77, 5, 220, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-023', 'Reporte Humedad Diciembre 23', 'humedad', '2025-12-23 15:15:00', '2025-12-23 15:15:00', '2025-12-23', 1, 'RPT-052', 75, 5, 219, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-024', 'Reporte Humedad Diciembre 24', 'humedad', '2025-12-24 13:30:00', '2025-12-24 13:30:00', '2025-12-24', 1, 'RPT-053', 79, 5, 220, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF12'),
('REP-HUM-025', 'Reporte Humedad Diciembre 25', 'humedad', '2025-12-25 14:45:00', '2025-12-25 14:45:00', '2025-12-25', 1, 'RPT-054', 74, 5, 221, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-026', 'Reporte Humedad Diciembre 26', 'humedad', '2025-12-26 15:00:00', '2025-12-26 15:00:00', '2025-12-26', 1, 'RPT-055', 75, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10'),
('REP-HUM-027', 'Reporte Humedad Diciembre 27', 'humedad', '2025-12-27 13:15:00', '2025-12-27 13:15:00', '2025-12-27', 1, 'RPT-056', 76, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF12'),
('REP-HUM-028', 'Reporte Humedad Diciembre 28', 'humedad', '2025-12-28 14:30:00', '2025-12-28 14:30:00', '2025-12-28', 1, 'RPT-057', 77, 5, 219, 16, 31, 36, 0, 0, 0, 'SEN005', 'CF06'),
('REP-HUM-029', 'Reporte Humedad Diciembre 29', 'humedad', '2025-12-29 15:45:00', '2025-12-29 15:45:00', '2025-12-29', 1, 'RPT-058', 74, 5, 220, 15, 30, 35, 0, 0, 0, 'SEN005', 'CF10');

-- Reportes de Voltaje (Sensor SEN10) - TODOS LOS DÍAS - Distribuidos en los 3 cuartos
INSERT INTO reporte (codigo, nombre, tipo_reporte, fecha_creacion, fecha_captura, fecha, activo, report_id, voltaje, amperaje, temperatura, humedad, presion_s, presion_e, aire, otro, puerta, codigo_sensor, codigo_cuarto) VALUES
('REP-VOLT-001', 'Reporte Voltaje Diciembre 01', 'voltaje', '2025-12-01 16:00:00', '2025-12-01 16:00:00', '2025-12-01', 1, 'RPT-059', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-002', 'Reporte Voltaje Diciembre 02', 'voltaje', '2025-12-02 17:15:00', '2025-12-02 17:15:00', '2025-12-02', 1, 'RPT-060', 218, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF06'),
('REP-VOLT-003', 'Reporte Voltaje Diciembre 03', 'voltaje', '2025-12-03 16:30:00', '2025-12-03 16:30:00', '2025-12-03', 1, 'RPT-061', 221, 16, 5, 76, 31, 36, 0, 0, 0, 'SEN10', 'CF10'),
('REP-VOLT-004', 'Reporte Voltaje Diciembre 04', 'voltaje', '2025-12-04 17:45:00', '2025-12-04 17:45:00', '2025-12-04', 1, 'RPT-062', 222, 16, 5, 76, 31, 36, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-005', 'Reporte Voltaje Diciembre 05', 'voltaje', '2025-12-05 16:20:00', '2025-12-05 16:20:00', '2025-12-05', 1, 'RPT-063', 219, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF06'),
('REP-VOLT-006', 'Reporte Voltaje Diciembre 06', 'voltaje', '2025-12-06 17:00:00', '2025-12-06 17:00:00', '2025-12-06', 1, 'RPT-064', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF10'),
('REP-VOLT-007', 'Reporte Voltaje Diciembre 07', 'voltaje', '2025-12-07 16:15:00', '2025-12-07 16:15:00', '2025-12-07', 1, 'RPT-065', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-008', 'Reporte Voltaje Diciembre 08', 'voltaje', '2025-12-08 17:30:00', '2025-12-08 17:30:00', '2025-12-08', 1, 'RPT-066', 221, 16, 5, 76, 31, 36, 0, 0, 0, 'SEN10', 'CF06'),
('REP-VOLT-009', 'Reporte Voltaje Diciembre 09', 'voltaje', '2025-12-09 16:45:00', '2025-12-09 16:45:00', '2025-12-09', 1, 'RPT-067', 219, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF10'),
('REP-VOLT-010', 'Reporte Voltaje Diciembre 10', 'voltaje', '2025-12-10 17:00:00', '2025-12-10 17:00:00', '2025-12-10', 1, 'RPT-068', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-011', 'Reporte Voltaje Diciembre 11', 'voltaje', '2025-12-11 16:15:00', '2025-12-11 16:15:00', '2025-12-11', 1, 'RPT-069', 221, 16, 5, 76, 31, 36, 0, 0, 0, 'SEN10', 'CF06'),
('REP-VOLT-012', 'Reporte Voltaje Diciembre 12', 'voltaje', '2025-12-12 17:30:00', '2025-12-12 17:30:00', '2025-12-12', 1, 'RPT-070', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF10'),
('REP-VOLT-013', 'Reporte Voltaje Diciembre 13', 'voltaje', '2025-12-13 16:45:00', '2025-12-13 16:45:00', '2025-12-13', 1, 'RPT-071', 219, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-014', 'Reporte Voltaje Diciembre 14', 'voltaje', '2025-12-14 17:00:00', '2025-12-14 17:00:00', '2025-12-14', 1, 'RPT-072', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF06'),
('REP-VOLT-015', 'Reporte Voltaje Diciembre 15', 'voltaje', '2025-12-15 16:20:00', '2025-12-15 16:20:00', '2025-12-15', 1, 'RPT-073', 221, 16, 5, 76, 31, 36, 0, 0, 0, 'SEN10', 'CF10'),
('REP-VOLT-016', 'Reporte Voltaje Diciembre 16', 'voltaje', '2025-12-16 17:35:00', '2025-12-16 17:35:00', '2025-12-16', 1, 'RPT-074', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-017', 'Reporte Voltaje Diciembre 17', 'voltaje', '2025-12-17 16:50:00', '2025-12-17 16:50:00', '2025-12-17', 1, 'RPT-075', 218, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF06'),
('REP-VOLT-018', 'Reporte Voltaje Diciembre 18', 'voltaje', '2025-12-18 17:05:00', '2025-12-18 17:05:00', '2025-12-18', 1, 'RPT-076', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF10'),
('REP-VOLT-019', 'Reporte Voltaje Diciembre 19', 'voltaje', '2025-12-19 16:20:00', '2025-12-19 16:20:00', '2025-12-19', 1, 'RPT-077', 221, 16, 5, 76, 31, 36, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-020', 'Reporte Voltaje Diciembre 20', 'voltaje', '2025-12-20 17:35:00', '2025-12-20 17:35:00', '2025-12-20', 1, 'RPT-078', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF06'),
('REP-VOLT-021', 'Reporte Voltaje Diciembre 21', 'voltaje', '2025-12-21 16:50:00', '2025-12-21 16:50:00', '2025-12-21', 1, 'RPT-079', 219, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF10'),
('REP-VOLT-022', 'Reporte Voltaje Diciembre 22', 'voltaje', '2025-12-22 17:05:00', '2025-12-22 17:05:00', '2025-12-22', 1, 'RPT-080', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-023', 'Reporte Voltaje Diciembre 23', 'voltaje', '2025-12-23 16:20:00', '2025-12-23 16:20:00', '2025-12-23', 1, 'RPT-081', 221, 16, 5, 76, 31, 36, 0, 0, 0, 'SEN10', 'CF06'),
('REP-VOLT-024', 'Reporte Voltaje Diciembre 24', 'voltaje', '2025-12-24 17:35:00', '2025-12-24 17:35:00', '2025-12-24', 1, 'RPT-082', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF10'),
('REP-VOLT-025', 'Reporte Voltaje Diciembre 25', 'voltaje', '2025-12-25 16:50:00', '2025-12-25 16:50:00', '2025-12-25', 1, 'RPT-083', 219, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-026', 'Reporte Voltaje Diciembre 26', 'voltaje', '2025-12-26 17:05:00', '2025-12-26 17:05:00', '2025-12-26', 1, 'RPT-084', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF06'),
('REP-VOLT-027', 'Reporte Voltaje Diciembre 27', 'voltaje', '2025-12-27 16:20:00', '2025-12-27 16:20:00', '2025-12-27', 1, 'RPT-085', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF10'),
('REP-VOLT-028', 'Reporte Voltaje Diciembre 28', 'voltaje', '2025-12-28 17:35:00', '2025-12-28 17:35:00', '2025-12-28', 1, 'RPT-086', 221, 16, 5, 76, 31, 36, 0, 0, 0, 'SEN10', 'CF12'),
('REP-VOLT-029', 'Reporte Voltaje Diciembre 29', 'voltaje', '2025-12-29 16:50:00', '2025-12-29 16:50:00', '2025-12-29', 1, 'RPT-087', 220, 15, 5, 75, 30, 35, 0, 0, 0, 'SEN10', 'CF06');

-- FIN DEL SCRIPT
-- Total de reportes insertados: 87 (29 días x 3 tipos de sensores)
-- Tipos de reportes: temperatura (29), humedad (29), voltaje (29)
-- Usando sensores reales: SEN001, SEN005, SEN10
-- Distribuidos en cuartos: CF06, CF10, CF12
-- Fechas: TODOS LOS DÍAS desde 01 de diciembre hasta 29 de diciembre de 2025
