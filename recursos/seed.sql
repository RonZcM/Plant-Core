-- script de inicializacion para SQLiteStudio
-- Borrar datos existentes si los hay para evitar conflictos (opcional)
DELETE FROM planta_presentacion;
DELETE FROM plantas;
DELETE FROM presentaciones;
DELETE FROM origen;
DELETE FROM empleados;

-- 1. Insertar Empleado
INSERT INTO empleados (created_at, created_by, updated_at, updated_by, apellido, dui, fecha_contratacion, nombre, numero) 
VALUES (CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 'Perez', '00000000-1', '2023-01-01', 'Juan', '7777-8888');

-- 2. Insertar Orígenes (Viveros)
INSERT INTO origen (created_at, created_by, updated_at, updated_by, codigo, nombre) 
VALUES 
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 'VI-80', 'Vivero 80%'),
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 'VI-30', 'Vivero 30%');

-- 3. Insertar Plantas
INSERT INTO plantas (created_at, created_by, updated_at, updated_by, codigo, nombre, nombre_cientifico) 
VALUES 
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 'PLA-01', 'Queso Suizo', 'Monstera adansonii'),
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 'PLA-02', 'Cinta', 'Chlorophytum comosum'),
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 'PLA-03', 'Pata de Elefante', 'Beaucarnea recurvata');

-- 4. Insertar Presentaciones (Macetas)
INSERT INTO presentaciones (created_at, created_by, updated_at, updated_by, cc, codigo, nombre, requisicion) 
VALUES 
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 500, 'MAC-06', 'Maceta 6 Pulgadas', 1),
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 1000, 'MAC-08', 'Maceta 8 Pulgadas', 1);

-- 5. Insertar Vínculos Planta-Presentación Iniciales (Stock Base)
-- Para facilitar las pruebas, insertaremos 3 plantas en Maceta 6 ya con un stock de 100 cada una.
-- Asumimos que los IDs autogenerados para Plantas son 1, 2, 3 y Presentaciones 1, 2
INSERT INTO planta_presentacion (created_at, created_by, updated_at, updated_by, codigo, detalle, es_arreglo_combinado, stock, tamanio, planta_id, presentacion_id) 
VALUES 
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 'INV-01', 'Planta Base', 0, 100, 'Mediano', (SELECT id FROM plantas WHERE codigo='PLA-01'), (SELECT id FROM presentaciones WHERE codigo='MAC-06')),
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 'INV-02', 'Planta Base', 0, 100, 'Mediano', (SELECT id FROM plantas WHERE codigo='PLA-02'), (SELECT id FROM presentaciones WHERE codigo='MAC-06')),
(CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP, 'Admin', 'INV-03', 'Planta Base', 0, 100, 'Mediano', (SELECT id FROM plantas WHERE codigo='PLA-03'), (SELECT id FROM presentaciones WHERE codigo='MAC-06'));
