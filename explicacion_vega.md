# Contexto del Sistema "Plant-Core" (CAPOSA)

Este documento ha sido generado para proveer contexto sobre la arquitectura, flujos de negocio y secciones del sistema Plant-Core.

## 1. Stack Tecnológico
- **Backend:** Java con Spring Boot, Spring Data JPA, Hibernate.
- **Base de Datos:** SQLite (`recursos/caposa.db`). Debido a SQLite, algunas alteraciones de esquema complejas se han gestionado creando scripts o permitiendo el auto-DDL de Hibernate.
- **Frontend:** React (Vite) estilizado con Tailwind CSS.
- **Exportación:** Apache POI para la generación de reportes en Excel.

## 2. Modelos de Dominio Clave

El núcleo del sistema gira en torno a cómo se maneja el inventario. A diferencia de un sistema simple de productos, aquí las plantas tienen "presentaciones".

- **Planta:** Diccionario de la especie botánica (`nombre`, `nombreCientifico`, `codigo`, `imagen`).
- **Presentacion:** El contenedor o formato físico (Ej. "Bolsa de 1 Galón", "Maceta #1").
- **PlantaPresentacion (Vínculo):** Es la intersección que representa el **Inventario Real**. Contiene:
  - La relación a una `Planta` y una `Presentacion`.
  - Atributos adicionales como `detalle` (ej. "3 plantas") y `tamanio` (ej. "8 pulgadas").
  - `stock`: La cantidad física disponible.
  - *Nota Especial:* Los **Arreglos Combinados** son un tipo de `PlantaPresentacion` en el que la `Planta` es nula, ya que agrupan múltiples especies en un solo contenedor.
- **Origen:** Representa ubicaciones físicas en la finca (Ej. "Vivero 80%", "Módulo 24").
- **Empleado:** Personal operativo que ejecuta las tareas.

## 3. Flujos del Sistema (Operaciones Diarias)

Todas las operaciones diarias afectan el `stock` de los registros en `PlantaPresentacion` y guardan un historial en la base de datos. Una operación puede realizarse por múltiples `Empleados`.

1. **Producción (Siembra):**
   - *Flujo:* Seleccionas de qué "orígenes" provienen los materiales (pueden ser múltiples), y defines un "Destino" (un Vínculo) al cual se le sumará stock.
   - *Nota:* Actualmente, en Producción, solo incrementa el destino (aunque la interfaz pida orígenes para registro).
2. **Cambio de Presentación (Trasplante / Armado):**
   - *Flujo:* Seleccionas uno o más Vínculos de origen para restarles stock, y un Vínculo de destino para sumarle stock.
   - *Uso:* Trasplantar de bolsa a maceta, o tomar 3 tipos de plantas diferentes para armar un "Arreglo Combinado".
3. **Descargo (Mermas):**
   - *Flujo:* Seleccionas un Vínculo, defines la cantidad a dar de baja y especificas un motivo (hongo, planta muerta, etc.). Resta del stock.
4. **Campo (Sembrado a Campo / Extraído de Campo):**
   - *Salida (Sembrar a campo):* Tomas plantas de tu inventario (resta stock) y las envías a ubicaciones físicas (`Origen`).
   - *Entrada (Sacar de campo):* Ingresas plantas nuevas al inventario provenientes de ubicaciones físicas (suma stock). El UI tiene selectores en cascada (Planta -> Presentaciones vinculadas).
5. **Entrada Exterior:**
   - *Flujo:* Suma stock directamente a un Vínculo por concepto de Compras a proveedores externos o Devoluciones.

## 4. Secciones del Frontend

El sistema está dividido en varias rutas/pantallas principales (`App.jsx`):

- **Bitácora General (`Dashboard.jsx`):** Es la pantalla principal. Muestra una línea de tiempo (tabla) consolidando todas las operaciones del vivero en orden cronológico. Permite filtrar por rango de fechas, texto (ID, Empleado, Detalle) y por Tipo de Operación.
- **Catálogo Visual (`CatalogoVisor.jsx`):** Una vista tipo cuadrícula con las fotos de las plantas. Al hacer clic en una, abre un modal que muestra información general y desglosa todos sus "Vínculos de Inventario" (`PlantaPresentacion`) junto con el stock de cada uno. Las fotos se sirven desde el backend Spring Boot mapeadas en `WebConfig` (`/fotos/**`).
- **Operaciones Diarias (`Operaciones.jsx`):** Pantalla con pestañas para ejecutar las 5 operaciones mencionadas en la sección anterior. Contiene formularios altamente controlados y selectores inteligentes (para evitar trasplantar una planta a sí misma, etc.).
- **Inventario (`Inventario.jsx`):** La tabla maestra de existencias. Muestra todos los vínculos (`PlantaPresentacion`) con su stock actual.
- **Catálogos / Personal:** Vistas de gestión CRUD para las tablas base (Plantas, Presentaciones, Orígenes, Empleados).

## 5. Exportación a Excel (`ExcelExportService.java`)

El sistema genera un archivo Excel completo basado en una plantilla del cliente. Dependiendo del rango de fechas seleccionado en la Bitácora, exporta:
- Una hoja principal de **Bitácora** que resume todos los movimientos, uniendo diferentes atributos (detalle, tamaño, planta, etc.) en columnas específicas (entradas, produccion, trasplante, descargos, campo).
- Una hoja dedicada para cada tipo de operación (PRODUCCIÓN, CAMBIO DE PRESENTACIÓN, DESCARGO, SEMBRADO A CAMPO, ENTRADA EXTERIOR) con detalles como trabajadores involucrados, lugares físicos o requerimientos específicos.
