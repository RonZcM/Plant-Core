# Documentación de Flujos de Operación - Plant-Core
**Proyecto:** Plant-Core (Desktop / Spring Boot + React + SQLite)
**Cliente/Empresa:** CAPOSA S.A. DE C.V. (Vivero)

Este documento detalla el flujo de información y procesos operativos de cada módulo del sistema, basado en la estructura de la base de datos (`bd_estructura.txt`) y la lógica de las bitácoras de Excel.

---

## 1. Módulo de Catálogos (Configuración Base)
Antes de registrar cualquier movimiento, el sistema debe alimentar los catálogos principales:
* **Empleados y Usuarios:** Registro de los trabajadores que ejecutan las acciones (ej. Liliam, Javier, David) y los usuarios con acceso al sistema.
* **Presentaciones:** Definición de los contenedores (Macetas, Bolsas, Decorativas). *Flujo crítico:* Cada presentación tiene un valor en `cc` (cantidad de sustrato). Esto permite que el sistema calcule automáticamente el gasto de tierra o sustrato por cada movimiento.
* **Plantas y Orígenes:** Catálogo maestro de especies y de dónde provienen (ej. "Vivero 80%", "Macetas flora").

---

## 2. Flujo de Producción (Entrada al Inventario)
Este flujo representa la creación o siembra inicial de una planta dentro del vivero local.

* **Actor:** Trabajador (Empleado).
* **Acción:** Sembrar una cantidad específica de una planta en una presentación determinada.
* **Datos de entrada:** * Día / Fecha.
    * Trabajador(es) asignado(s).
    * Planta y Presentación (ej. *Queso suizo 5 plantas en PC#1*).
    * Origen de la planta.
    * Tiempo invertido (Horas).
    * Requisición (Número de control).
* **Impacto en el sistema:** * Suma al inventario de la `planta_presentacion` resultante.
    * Calcula el material utilizado (Sustrato = Cantidad * cc de la presentación).

---

## 3. Flujo de Cambio de Presentación (Transformación)
Este flujo maneja el trasplante o cambio de contenedor de una planta existente.

* **Actor:** Trabajador (Empleado).
* **Acción:** Mover una planta de una presentación (Origen) a otra diferente (Destino). Por ejemplo, pasar de *Bolsa 9x12* a *Maceta #4*.
* **Datos de entrada:**
    * Día / Fecha y Trabajador.
    * Cantidad de plantas a trasladar.
    * Presentación Antigua (Origen) y Nueva Presentación (Destino).
    * Códigos y Requisición.
* **Impacto en el sistema:**
    * Resta la cantidad especificada del inventario de la presentación Origen.
    * Suma la cantidad al inventario de la presentación Destino.
    * *Posible cálculo secundario:* Diferencia de sustrato requerido para el nuevo contenedor.

---

## 4. Flujo de Siembra a Campo (Salida Temporal/Definitiva)
Representa el movimiento de plantas desde los contenedores del vivero hacia la tierra firme (campo).

* **Actor:** Trabajador (Empleado).
* **Acción:** Sembrar plantas en el campo.
* **Datos de entrada:**
    * Fecha y Trabajador.
    * Cantidad de plantas.
    * Lugar de siembra.
* **Impacto en el sistema:**
    * Resta del inventario de plantas en contenedor (vivero).
    * Añade al registro de plantas "En Campo" para seguimiento posterior (hasta que se saquen de campo).

---

## 5. Flujo de Descargo (Mermas y Pérdidas)
Este flujo es vital para cuadrar el inventario real contra el sistema cuando hay pérdidas inevitables.

* **Actor:** Administrador / Supervisor.
* **Acción:** Dar de baja plantas del inventario por causas de fuerza mayor.
* **Datos de entrada:**
    * Fecha y Trabajador responsable del lote.
    * Cantidad a descargar.
    * Código de la planta/presentación.
    * **Motivo de descargo:** Ej. "Se las comió el zompopo", "Se murieron por falta de mantenimiento", "No se adaptaron al clima", "Por viejas".
* **Impacto en el sistema:**
    * Resta de forma absoluta del inventario.
    * Genera un registro histórico en la tabla de descargo para auditoría.

---

## 6. Módulo de Reportes: La Bitácora Unificada
El núcleo de reporteo del sistema es la Vista Unificada (`vista_bitacora_ml`).

* **Objetivo:** Consolidar todos los movimientos (Producción, Cambios, Descargos, Campo) en una sola tabla cronológica, replicando la experiencia de las hojas de Excel (`Bitacoras de Mercado local.xlsx`).
* **Flujo:**
    1.  El usuario en React filtra por Mes, Año o Rango de Fechas.
    2.  Spring Boot consulta la vista `vista_bitacora_ml` en SQLite.
    3.  El sistema devuelve una lista ordenada donde cada fila indica el `tipo_movimiento` y los detalles correspondientes (cantidades, trabajadores, tiempo).
    4.  El frontend renderiza la tabla consolidada, permitiendo al encargado (ej. Douglas López) supervisar toda la operación de un vistazo.
