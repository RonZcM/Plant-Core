-- Borrar datos existentes si los hay para evitar conflictos y restablecer secuencias
DELETE FROM produccion_trabajadores;
DELETE FROM cambio_presentacion_trabajadores;
DELETE FROM cambio_presentacion_detalle;
DELETE FROM descargo_trabajadores;
DELETE FROM entrada_exterior_trabajadores;
DELETE FROM produccion_origen;
DELETE FROM produccion;
DELETE FROM cambio_presentacion;
DELETE FROM descargo;
DELETE FROM entrada_exterior;
DELETE FROM planta_presentacion;
DELETE FROM plantas;
DELETE FROM presentaciones;
DELETE FROM origen;
DELETE FROM empleados;

DELETE FROM sqlite_sequence;

-- 1. Insertar Empleados (IDs 1 a 3)
INSERT INTO empleados (id, created_at, created_by, updated_at, updated_by, nombre, apellido, dui, fecha_contratacion, numero) 
VALUES 
(1, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'Liliam', 'Gomez', '00000001-1', '2023-01-01', '7777-1111'),
(2, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'Javier', 'Perez', '00000002-2', '2023-02-01', '7777-2222'),
(3, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'David', 'Lopez', '00000003-3', '2023-03-01', '7777-3333');

-- 2. Insertar Orígenes (Viveros) (IDs 1 y 2)
INSERT INTO origen (id, created_at, created_by, updated_at, updated_by, codigo, nombre) 
VALUES 
(1, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'VI-80', 'Vivero 80%'),
(2, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'VI-30', 'Vivero 30%');

-- 3. Insertar Plantas (IDs 1 a 3)
INSERT INTO plantas (id, created_at, created_by, updated_at, updated_by, codigo, nombre, nombre_cientifico, imagen) 
VALUES 
(1, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'PLA-01', 'Queso Suizo', 'Monstera adansonii', NULL),
(2, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'PLA-02', 'Cinta', 'Chlorophytum comosum', NULL),
(3, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'PLA-03', 'Pata de Elefante', 'Beaucarnea recurvata', NULL);

-- 4. Insertar Presentaciones (Macetas) (IDs 1 y 2)
INSERT INTO presentaciones (id, created_at, created_by, updated_at, updated_by, cc, codigo, nombre, requisicion) 
VALUES 
(1, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 500, 'MAC-06', 'Maceta 6 Pulgadas', 1),
(2, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 1000, 'MAC-08', 'Maceta 8 Pulgadas', 1);

-- 5. Insertar Inventario (Planta_Presentacion) (IDs 1 a 4)
INSERT INTO planta_presentacion (id, created_at, created_by, updated_at, updated_by, codigo, es_arreglo_combinado, stock, detalle, tamanio, planta_id, presentacion_id) 
VALUES 
(1, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'INV-01', 0, 100, '1 Planta', '6 pulgadas', 1, 1),
(2, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'INV-02', 0, 50,  '1 Planta', '6 pulgadas', 2, 1),
(3, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'INV-03', 0, 0,   '3 Plantas', '8 pulgadas', 3, 2),
(4, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', 'INV-ARR', 1, 10,  'Arreglo mixto', '8 pulgadas', NULL, 2);

-- 6. Generar Operación: Producción de Pata de Elefante (ID 1)
INSERT INTO produccion (id, created_at, created_by, updated_at, updated_by, fecha, cantidad, siembra_tiempo_horas, planta_presentacion_id)
VALUES (1, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d 00:00:00.000', 'now', '-2 days'), 50, 2.5, 3);
-- Trabajadores de Produccion (Liliam, Javier)
INSERT INTO produccion_trabajadores (produccion_id, empleado_id) VALUES (1, 1), (1, 2);
-- Origenes de Produccion (Vivero 80%)
INSERT INTO produccion_origen (produccion_id, origen_id) VALUES (1, 1);

-- 7. Generar Operación: Cambio de Presentación (Trasplante) hacia Arreglo Combinado (ID 1)
INSERT INTO cambio_presentacion (id, created_at, created_by, updated_at, updated_by, fecha, cantidad_destino, planta_presentacion_destino_id)
VALUES (1, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d 00:00:00.000', 'now', '-1 days'), 10, 4);
-- Trabajadores del Cambio (David, Liliam)
INSERT INTO cambio_presentacion_trabajadores (cambio_presentacion_id, empleado_id) VALUES (1, 3), (1, 1);
-- Detalles del Cambio (Salen 10 Queso Suizo y 10 Cinta)
INSERT INTO cambio_presentacion_detalle (id, cantidad_origen, cambio_presentacion_id, planta_presentacion_origen_id) 
VALUES 
(1, 10, 1, 1),
(2, 10, 1, 2);

-- 8. Generar Operación: Descargo de Cinta (ID 1)
INSERT INTO descargo (id, created_at, created_by, updated_at, updated_by, fecha, cantidad, motivo_descargo, planta_presentacion_id)
VALUES (1, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d 00:00:00.000', 'now'), 5, 'Planta muerta por exceso de agua', 2);
-- Trabajador del Descargo (Javier)
INSERT INTO descargo_trabajadores (descargo_id, empleado_id) VALUES (1, 2);

-- 9. Generar Operación: Entrada Exterior de Queso Suizo (ID 1)
INSERT INTO entrada_exterior (id, created_at, created_by, updated_at, updated_by, fecha, cantidad, tipo, detalle, total_precio, planta_presentacion_id)
VALUES (1, strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d %H:%M:%f', 'now'), 'Admin', strftime('%Y-%m-%d 00:00:00.000', 'now'), 20, 'Devolucion', 'Devuelto por cliente en buen estado', NULL, 1);
-- Trabajador de Entrada (David)
INSERT INTO entrada_exterior_trabajadores (entrada_exterior_id, empleado_id) VALUES (1, 3);
