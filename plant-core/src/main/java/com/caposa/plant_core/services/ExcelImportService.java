package com.caposa.plant_core.services;

import com.caposa.plant_core.models.*;
import com.caposa.plant_core.models.dto.ImportResultDTO;
import com.caposa.plant_core.repositories.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class ExcelImportService {

    @Autowired private EmpleadoRepository empleadoRepo;
    @Autowired private PlantaPresentacionRepository ppRepo;
    @Autowired private ProduccionService produccionService;
    @Autowired private DescargoService descargoService;
    @Autowired private EntradaExteriorService entradaExteriorService;

    // ============================
    // IMPORTAR EMPLEADOS
    // ============================
    // Soporta:
    //  - Excel exportado por el sistema (encabezados en fila 2: "ID", "Nombres", "Apellidos", "DUI", "Teléfono", "Fecha Contratación")
    //  - Excel simple del usuario (encabezados en fila 0: "Nombre", "Apellido", "DUI", ...)
    @Transactional
    public ImportResultDTO importarEmpleados(MultipartFile file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int totalFilas = 0;

            // Detectar automáticamente la fila de encabezados
            int headerRowIndex = detectarFilaEncabezados(sheet, "dui");
            if (headerRowIndex < 0) {
                result.agregarError("No se encontró una fila de encabezados con la columna 'DUI'. Verifique el formato del archivo.");
                return result;
            }

            Row headerRow = sheet.getRow(headerRowIndex);
            Map<String, Integer> columnMap = mapearColumnas(headerRow);

            for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                totalFilas++;
                int filaNum = i + 1;

                try {
                    // Soporta tanto "Nombre"/"Nombres" como el formato del exportador
                    String nombre = getCellStringValue(row, columnMap, "nombre", "nombres");
                    String apellido = getCellStringValue(row, columnMap, "apellido", "apellidos");
                    String dui = getCellStringValue(row, columnMap, "dui");
                    String numero = getCellStringValue(row, columnMap, "telefono", "numero", "teléfono");
                    String fechaContratacion = getCellStringValue(row, columnMap,
                            "fecha contratacion", "fecha contratación",
                            "fechacontratacion", "fecha_contratacion");

                    // Validaciones
                    if (nombre == null || nombre.trim().isEmpty()) {
                        result.agregarError("Fila " + filaNum + ": El nombre es obligatorio.");
                        result.incrementarOmitidas();
                        continue;
                    }
                    if (apellido == null || apellido.trim().isEmpty()) {
                        result.agregarError("Fila " + filaNum + ": El apellido es obligatorio.");
                        result.incrementarOmitidas();
                        continue;
                    }
                    if (dui == null || dui.trim().isEmpty()) {
                        result.agregarError("Fila " + filaNum + ": El DUI es obligatorio.");
                        result.incrementarOmitidas();
                        continue;
                    }

                    // Verificar duplicado por DUI
                    if (empleadoRepo.findByDui(dui.trim()).isPresent()) {
                        result.agregarError("Fila " + filaNum + ": DUI " + dui + " ya existe. Omitida.");
                        result.incrementarOmitidas();
                        continue;
                    }

                    // Limpiar "N/A" que viene del exportador
                    if (numero != null && numero.trim().equalsIgnoreCase("N/A")) numero = null;
                    if (fechaContratacion != null && fechaContratacion.trim().equalsIgnoreCase("N/A")) fechaContratacion = null;

                    Empleado emp = new Empleado();
                    emp.setNombre(nombre.trim());
                    emp.setApellido(apellido.trim());
                    emp.setDui(dui.trim());
                    emp.setNumero(numero != null ? numero.trim() : null);
                    emp.setFechaContratacion(fechaContratacion != null ? fechaContratacion.trim() : null);
                    emp.setCreatedBy("Importación Excel");

                    empleadoRepo.save(emp);
                    result.incrementarImportadas();

                } catch (Exception e) {
                    result.agregarError("Fila " + filaNum + ": " + e.getMessage());
                    result.incrementarOmitidas();
                }
            }

            result.setTotalFilas(totalFilas);
        }

        return result;
    }

    // ============================
    // IMPORTAR BITÁCORA
    // ============================
    // Soporta:
    //  - Excel exportado por el sistema (hojas separadas: "Producción", "Descargos", "Entradas Exteriores", etc.)
    //  - Excel simple del usuario con columnas: Tipo, Fecha, Código Lote, Cantidad, Detalle, Empleado
    @Transactional
    public ImportResultDTO importarBitacora(MultipartFile file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            // Estrategia 1: Si la primera hoja tiene una columna "Tipo", usar formato simple
            Sheet primeraHoja = workbook.getSheetAt(0);
            int headerIdx = detectarFilaEncabezados(primeraHoja, "tipo");

            if (headerIdx >= 0) {
                // Formato simple: una sola hoja con columna "Tipo"
                importarBitacoraSimple(primeraHoja, headerIdx, result);
            } else {
                // Estrategia 2: Buscar hojas nombradas del exportador del sistema
                importarDesdeHojasDelExportador(workbook, result);
            }
        }

        return result;
    }

    // --- Importar formato simple (una hoja con columna Tipo) ---
    private void importarBitacoraSimple(Sheet sheet, int headerRowIndex, ImportResultDTO result) {
        Row headerRow = sheet.getRow(headerRowIndex);
        Map<String, Integer> columnMap = mapearColumnas(headerRow);

        for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;
            result.setTotalFilas(result.getTotalFilas() + 1);
            int filaNum = i + 1;

            try {
                String tipo = getCellStringValue(row, columnMap, "tipo", "tipo movimiento", "tipo_movimiento", "operacion", "operación");
                String fechaStr = getCellStringValue(row, columnMap, "fecha");
                String codigoLote = getCellStringValue(row, columnMap, "codigo lote", "código lote", "codigo", "código", "lote", "codigo_lote");
                String cantidadStr = getCellStringValue(row, columnMap, "cantidad", "cant.", "cant");
                String detalle = getCellStringValue(row, columnMap, "detalle", "motivo", "descripcion", "descripción", "motivo de descargo");
                String empleadoRef = getCellStringValue(row, columnMap, "empleado", "trabajador", "personal", "dui empleado");

                if (tipo == null || tipo.trim().isEmpty()) {
                    result.agregarError("Fila " + filaNum + ": El tipo de operación es obligatorio.");
                    result.incrementarOmitidas();
                    continue;
                }
                if (codigoLote == null || codigoLote.trim().isEmpty()) {
                    result.agregarError("Fila " + filaNum + ": El código de lote es obligatorio.");
                    result.incrementarOmitidas();
                    continue;
                }
                if (cantidadStr == null || cantidadStr.trim().isEmpty()) {
                    result.agregarError("Fila " + filaNum + ": La cantidad es obligatoria.");
                    result.incrementarOmitidas();
                    continue;
                }

                int cantidad = parsearCantidad(cantidadStr, filaNum, result);
                if (cantidad <= 0) { result.incrementarOmitidas(); continue; }

                LocalDate fecha = parsearFecha(fechaStr, filaNum, result);
                if (fecha == null) { result.incrementarOmitidas(); continue; }

                Optional<PlantaPresentacion> ppOpt = ppRepo.findByCodigo(codigoLote.trim());
                if (!ppOpt.isPresent()) {
                    result.agregarError("Fila " + filaNum + ": Lote con código '" + codigoLote + "' no encontrado.");
                    result.incrementarOmitidas();
                    continue;
                }

                List<Empleado> trabajadores = buscarEmpleados(empleadoRef);
                procesarOperacion(tipo, fecha, ppOpt.get(), cantidad, trabajadores, detalle, filaNum, result);

            } catch (Exception e) {
                result.agregarError("Fila " + filaNum + ": " + e.getMessage());
                result.incrementarOmitidas();
            }
        }
    }

    // --- Importar desde hojas del exportador del sistema ---
    private void importarDesdeHojasDelExportador(Workbook workbook, ImportResultDTO result) {
        for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
            Sheet sheet = workbook.getSheetAt(s);
            String sheetName = sheet.getSheetName().toLowerCase().trim();

            // Saltar hojas que no son datos importables
            if (sheetName.contains("bitácora") || sheetName.contains("bitacora") ||
                sheetName.contains("constante") || sheetName.contains("personal")) {
                continue;
            }

            // Detectar la fila de encabezados buscando "Fecha" o "Cant."
            int headerIdx = detectarFilaEncabezados(sheet, "fecha");
            if (headerIdx < 0) headerIdx = detectarFilaEncabezados(sheet, "cant.");
            if (headerIdx < 0) continue;

            Row headerRow = sheet.getRow(headerIdx);
            Map<String, Integer> columnMap = mapearColumnas(headerRow);

            // Determinar el tipo de operación por el nombre de la hoja
            String tipoOperacion = determinarTipoPorHoja(sheetName);
            if (tipoOperacion == null) continue;

            for (int i = headerIdx + 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                result.setTotalFilas(result.getTotalFilas() + 1);
                int filaNum = i + 1;

                try {
                    String fechaStr = getCellStringValue(row, columnMap, "fecha");
                    String cantidadStr = getCellStringValue(row, columnMap, "cantidad", "cant.", "cant", "cantidad producida");
                    String codigoLote = getCellStringValue(row, columnMap, "codigo", "código", "codigo lote", "código lote", "lote");
                    String detalle = getCellStringValue(row, columnMap, "detalle", "motivo", "motivo de descargo", "descripcion");
                    String empleadoRef = getCellStringValue(row, columnMap, "trabajador", "empleado", "personal");

                    if (cantidadStr == null || cantidadStr.trim().isEmpty()) continue; // Fila sin datos útiles

                    int cantidad = parsearCantidad(cantidadStr, filaNum, result);
                    if (cantidad <= 0) { result.incrementarOmitidas(); continue; }

                    LocalDate fecha = parsearFecha(fechaStr, filaNum, result);
                    if (fecha == null) { result.incrementarOmitidas(); continue; }

                    // Si no hay código en columna propia, buscarlo en la columna "nombre" del exportador
                    if (codigoLote == null || codigoLote.trim().isEmpty()) {
                        String nombrePlanta = getCellStringValue(row, columnMap, "nombre de la planta (cantidad y tamaño)",
                                "nombre de la planta", "planta", "nombre planta");
                        if (nombrePlanta != null) codigoLote = extraerCodigoDeTexto(nombrePlanta);
                    }

                    if (codigoLote == null || codigoLote.trim().isEmpty()) {
                        result.agregarError("Hoja '" + sheet.getSheetName() + "' Fila " + filaNum + ": No se pudo determinar el código de lote.");
                        result.incrementarOmitidas();
                        continue;
                    }

                    Optional<PlantaPresentacion> ppOpt = ppRepo.findByCodigo(codigoLote.trim());
                    if (!ppOpt.isPresent()) {
                        result.agregarError("Hoja '" + sheet.getSheetName() + "' Fila " + filaNum + ": Lote '" + codigoLote + "' no encontrado.");
                        result.incrementarOmitidas();
                        continue;
                    }

                    List<Empleado> trabajadores = buscarEmpleados(empleadoRef);
                    procesarOperacion(tipoOperacion, fecha, ppOpt.get(), cantidad, trabajadores, detalle, filaNum, result);

                } catch (Exception e) {
                    result.agregarError("Hoja '" + sheet.getSheetName() + "' Fila " + filaNum + ": " + e.getMessage());
                    result.incrementarOmitidas();
                }
            }
        }
    }

    // ============================
    // PROCESAMIENTO DE OPERACIONES
    // ============================
    private void procesarOperacion(String tipo, LocalDate fecha, PlantaPresentacion pp, int cantidad,
                                    List<Empleado> trabajadores, String detalle, int filaNum, ImportResultDTO result) {
        String tipoNormalizado = tipo.trim().toLowerCase()
                .replace("ó", "o")
                .replace("á", "a")
                .replace("é", "e")
                .replace("í", "i")
                .replace("ú", "u");

        switch (tipoNormalizado) {
            case "produccion":
            case "producción":
            case "prod":
                crearProduccion(fecha, pp, cantidad, trabajadores, detalle);
                result.incrementarImportadas();
                break;
            case "descargo":
            case "baja":
            case "merma":
            case "descargo de plantas":
                crearDescargo(fecha, pp, cantidad, trabajadores, detalle);
                result.incrementarImportadas();
                break;
            case "entrada":
            case "entrada exterior":
            case "compra":
                crearEntradaExterior(fecha, pp, cantidad, trabajadores, detalle, "compra");
                result.incrementarImportadas();
                break;
            case "devolucion":
            case "devolución":
                crearEntradaExterior(fecha, pp, cantidad, trabajadores, detalle, "devolucion");
                result.incrementarImportadas();
                break;
            default:
                result.agregarError("Fila " + filaNum + ": Tipo '" + tipo + "' no reconocido. Use: Producción, Descargo, Entrada Exterior, Compra o Devolución.");
                result.incrementarOmitidas();
        }
    }

    // ============================
    // CREACIÓN DE REGISTROS
    // ============================
    private void crearProduccion(LocalDate fecha, PlantaPresentacion pp, int cantidad, List<Empleado> trabajadores, String detalle) {
        Produccion prod = new Produccion();
        prod.setFecha(fecha);
        prod.setPlantaPresentacion(pp);
        prod.setCantidad(cantidad);
        prod.setTrabajadores(trabajadores);
        prod.setSiembraTiempoHoras(0.0);
        prod.setOrigenes(new HashSet<>());
        prod.setCreatedBy("Importación Excel");
        produccionService.registrarProduccion(prod);
    }

    private void crearDescargo(LocalDate fecha, PlantaPresentacion pp, int cantidad, List<Empleado> trabajadores, String detalle) {
        Descargo desc = new Descargo();
        desc.setFecha(fecha);
        desc.setPlantaPresentacion(pp);
        desc.setCantidad(cantidad);
        desc.setTrabajadores(trabajadores);
        desc.setMotivoDescargo(detalle != null ? detalle : "Importado desde Excel");
        desc.setCreatedBy("Importación Excel");
        descargoService.registrarDescargo(desc);
    }

    private void crearEntradaExterior(LocalDate fecha, PlantaPresentacion pp, int cantidad, List<Empleado> trabajadores, String detalle, String tipoEntrada) {
        EntradaExterior entrada = new EntradaExterior();
        entrada.setFecha(fecha);
        entrada.setPlantaPresentacion(pp);
        entrada.setCantidad(cantidad);
        entrada.setTrabajadores(trabajadores);
        entrada.setTipo(tipoEntrada);
        entrada.setDetalle(detalle != null ? detalle : "Importado desde Excel");
        entrada.setCreatedBy("Importación Excel");
        entradaExteriorService.registrarEntrada(entrada);
    }

    // ============================
    // MÉTODOS AUXILIARES
    // ============================

    /**
     * Detecta automáticamente en qué fila están los encabezados buscando
     * una celda que contenga la palabra clave (ej: "dui", "fecha", "tipo").
     * Revisa las primeras 10 filas.
     */
    private int detectarFilaEncabezados(Sheet sheet, String palabraClave) {
        String claveLimpia = normalizarTexto(palabraClave);
        int maxFila = Math.min(10, sheet.getLastRowNum());
        for (int i = 0; i <= maxFila; i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            for (int c = 0; c < row.getLastCellNum(); c++) {
                Cell cell = row.getCell(c);
                if (cell != null && cell.getCellType() == CellType.STRING) {
                    String val = normalizarTexto(cell.getStringCellValue());
                    if (val.equals(claveLimpia) || val.contains(claveLimpia)) {
                        return i;
                    }
                }
            }
        }
        return -1;
    }

    /**
     * Determina el tipo de operación según el nombre de la hoja del exportador.
     */
    private String determinarTipoPorHoja(String sheetName) {
        if (sheetName.contains("produccion") || sheetName.contains("producción")) return "Producción";
        if (sheetName.contains("descargo")) return "Descargo";
        if (sheetName.contains("entrada")) return "Entrada Exterior";
        if (sheetName.contains("cambio")) return null; // No soportado en importación
        if (sheetName.contains("campo") || sheetName.contains("siembra")) return null; // No soportado
        return null;
    }

    /**
     * Intenta extraer un código de lote de un texto libre.
     * Ej: "[PQCA01001] Maceta 8 pulgadas" → "PQCA01001"
     */
    private String extraerCodigoDeTexto(String texto) {
        if (texto == null) return null;
        // Buscar patrón [CODIGO]
        int start = texto.indexOf('[');
        int end = texto.indexOf(']');
        if (start >= 0 && end > start) {
            return texto.substring(start + 1, end).trim();
        }
        // Si no hay corchetes, devolver el texto limpio (podría ser solo el código)
        return texto.trim();
    }

    private List<Empleado> buscarEmpleados(String empleadoRef) {
        List<Empleado> trabajadores = new ArrayList<>();
        if (empleadoRef == null || empleadoRef.trim().isEmpty()) return trabajadores;

        // Si contiene guiones separando nombres, dividir
        String[] refs = empleadoRef.contains("-") ? empleadoRef.split("-") : new String[]{empleadoRef};

        for (String ref : refs) {
            String trimRef = ref.trim();
            if (trimRef.isEmpty()) continue;

            // Intentar buscar por DUI primero
            Optional<Empleado> byDui = empleadoRepo.findByDui(trimRef);
            if (byDui.isPresent()) {
                trabajadores.add(byDui.get());
                continue;
            }

            // Buscar por nombre (coincidencia parcial)
            String refLower = trimRef.toLowerCase();
            List<Empleado> todos = empleadoRepo.findAll();
            for (Empleado emp : todos) {
                String nombreCompleto = (emp.getNombre() + " " + emp.getApellido()).toLowerCase();
                String soloNombre = emp.getNombre().toLowerCase();
                if (nombreCompleto.contains(refLower) || refLower.contains(nombreCompleto) || soloNombre.equals(refLower)) {
                    trabajadores.add(emp);
                    break;
                }
            }
        }

        return trabajadores;
    }

    private LocalDate parsearFecha(String fechaStr, int filaNum, ImportResultDTO result) {
        if (fechaStr == null || fechaStr.trim().isEmpty()) {
            return LocalDate.now();
        }

        String trimmed = fechaStr.trim();

        String[] formatos = {"yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "d/M/yyyy", "dd-MM-yyyy"};
        for (String fmt : formatos) {
            try {
                return LocalDate.parse(trimmed, DateTimeFormatter.ofPattern(fmt));
            } catch (DateTimeParseException ignored) {}
        }

        // Intentar parsear formato "dd-MMM" con año actual (del exportador)
        try {
            String conAnio = trimmed + "-" + LocalDate.now().getYear();
            return LocalDate.parse(conAnio, DateTimeFormatter.ofPattern("dd-MMM-yyyy", new java.util.Locale("es", "ES")));
        } catch (Exception ignored) {}

        result.agregarError("Fila " + filaNum + ": Formato de fecha no reconocido '" + fechaStr + "'. Use yyyy-MM-dd o dd/MM/yyyy.");
        return null;
    }

    private int parsearCantidad(String cantidadStr, int filaNum, ImportResultDTO result) {
        try {
            int cantidad = (int) Double.parseDouble(cantidadStr.trim());
            if (cantidad <= 0) {
                result.agregarError("Fila " + filaNum + ": La cantidad debe ser mayor a 0.");
                return 0;
            }
            return cantidad;
        } catch (NumberFormatException e) {
            result.agregarError("Fila " + filaNum + ": Cantidad inválida '" + cantidadStr + "'.");
            return 0;
        }
    }

    private Map<String, Integer> mapearColumnas(Row headerRow) {
        Map<String, Integer> map = new HashMap<>();
        for (int c = 0; c < headerRow.getLastCellNum(); c++) {
            Cell cell = headerRow.getCell(c);
            if (cell != null && cell.getCellType() == CellType.STRING) {
                String headerName = normalizarTexto(cell.getStringCellValue());
                if (!headerName.trim().isEmpty()) {
                    map.put(headerName, c);
                }
            }
        }
        return map;
    }

    private String normalizarTexto(String texto) {
        return texto.trim().toLowerCase()
                .replace("á", "a")
                .replace("é", "e")
                .replace("í", "i")
                .replace("ó", "o")
                .replace("ú", "u");
    }

    /**
     * Busca un valor de celda probando múltiples nombres de columna posibles.
     */
    private String getCellStringValue(Row row, Map<String, Integer> columnMap, String... possibleNames) {
        for (String name : possibleNames) {
            String normalizedName = normalizarTexto(name);
            // Buscar coincidencia exacta primero
            Integer colIdx = columnMap.get(normalizedName);
            if (colIdx != null) {
                Cell cell = row.getCell(colIdx);
                String val = getCellAsString(cell);
                if (val != null) return val;
            }
            // Buscar coincidencia parcial (encabezados largos del exportador)
            for (Map.Entry<String, Integer> entry : columnMap.entrySet()) {
                if (entry.getKey().contains(normalizedName) || normalizedName.contains(entry.getKey())) {
                    Cell cell = row.getCell(entry.getValue());
                    String val = getCellAsString(cell);
                    if (val != null) return val;
                }
            }
        }
        return null;
    }

    private String getCellAsString(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                String strVal = cell.getStringCellValue();
                return (strVal != null && !strVal.trim().isEmpty()) ? strVal : null;
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    java.util.Date date = cell.getDateCellValue();
                    return new java.text.SimpleDateFormat("yyyy-MM-dd").format(date);
                }
                double numVal = cell.getNumericCellValue();
                if (numVal == Math.floor(numVal) && !Double.isInfinite(numVal)) {
                    return String.valueOf((long) numVal);
                }
                return String.valueOf(numVal);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case BLANK:
                return null;
            default:
                return null;
        }
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellAsString(cell);
                if (val != null && !val.trim().isEmpty()) return false;
            }
        }
        return true;
    }
}
