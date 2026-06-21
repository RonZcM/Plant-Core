package com.caposa.plant_core.services;

import com.caposa.plant_core.models.*;
import com.caposa.plant_core.repositories.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExcelExportService {

    @Autowired private ProduccionRepository produccionRepo;
    @Autowired private CambioPresentacionRepository cambioRepo;
    @Autowired private DescargoRepository descargoRepo;
    @Autowired private EntradaExteriorRepository entradaRepo;
    @Autowired private PresentacionRepository presentacionRepo;

    public byte[] exportarBitacora() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            List<Produccion> producciones = produccionRepo.findAll();
            List<CambioPresentacion> cambios = cambioRepo.findAll();
            List<Descargo> descargos = descargoRepo.findAll();
            List<EntradaExterior> entradas = entradaRepo.findAll();
            List<Presentacion> presentaciones = presentacionRepo.findAll();

            crearHojaBitacora(workbook, producciones, cambios, descargos, entradas);
            crearHojaProduccion(workbook, producciones);
            crearHojaDescargo(workbook, descargos);
            crearHojaCambio(workbook, cambios);
            crearHojaEntradaExterior(workbook, entradas);
            crearHojaConstantes(workbook, presentaciones);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    // --- ESTILOS ---
    private CellStyle createHeaderStyle(Workbook wb, IndexedColors bgColor, boolean isGroupHeader) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        if (bgColor == IndexedColors.GREY_50_PERCENT || bgColor == IndexedColors.DARK_BLUE) {
            font.setColor(IndexedColors.WHITE.getIndex());
        }
        style.setFont(font);
        if (bgColor != null) {
            style.setFillForegroundColor(bgColor.getIndex());
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
        if (isGroupHeader) {
            style.setAlignment(HorizontalAlignment.CENTER);
            style.setVerticalAlignment(VerticalAlignment.CENTER);
        } else {
            style.setAlignment(HorizontalAlignment.LEFT);
            style.setVerticalAlignment(VerticalAlignment.BOTTOM);
        }
        style.setWrapText(true);
        setBorders(style);
        return style;
    }

    private CellStyle createDataStyle(Workbook wb, boolean wrap) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.BOTTOM);
        if (wrap) style.setWrapText(true);
        setBorders(style);
        return style;
    }

    private CellStyle createDateStyle(Workbook wb) {
        CellStyle style = createDataStyle(wb, false);
        CreationHelper createHelper = wb.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("dd-MMM"));
        return style;
    }

    private void setBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    private void crearHojaBitacora(Workbook workbook, List<Produccion> producciones, List<CambioPresentacion> cambios, List<Descargo> descargos, List<EntradaExterior> entradas) {
        Sheet sheet = workbook.createSheet("Bitácora");
        sheet.createFreezePane(0, 4);

        boolean hasProd = !producciones.isEmpty();
        boolean hasSiembra = false; // Siempre oculto si no hay registros
        boolean hasCambio = !cambios.isEmpty();
        boolean hasEntrada = !entradas.isEmpty();
        boolean hasDescargo = !descargos.isEmpty();

        int colIndex = 5; // Inicia despues de los 5 datos comunes (0-4)
        
        int prodStart = -1, prodEnd = -1;
        if (hasProd) { prodStart = colIndex; prodEnd = colIndex + 4; colIndex += 5; }
        
        int siembraStart = -1, siembraEnd = -1;
        if (hasSiembra) { siembraStart = colIndex; siembraEnd = colIndex + 1; colIndex += 2; }
        
        int cambioStart = -1, cambioEnd = -1;
        if (hasCambio) { cambioStart = colIndex; cambioEnd = colIndex + 2; colIndex += 3; }
        
        int entradaStart = -1, entradaEnd = -1;
        if (hasEntrada) { entradaStart = colIndex; entradaEnd = colIndex + 2; colIndex += 3; }
        
        int descargoStart = -1, descargoEnd = -1;
        if (hasDescargo) { descargoStart = colIndex; descargoEnd = colIndex; colIndex += 1; }

        int finalDatosStart = colIndex;
        int finalDatosEnd = colIndex + 2;
        int totalCols = colIndex + 3;

        CellStyle styleTitle = workbook.createCellStyle();
        Font fontTitle = workbook.createFont();
        fontTitle.setBold(true);
        
        styleTitle.setFont(fontTitle);
        styleTitle.setAlignment(HorizontalAlignment.CENTER);
        styleTitle.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle styleInfo = workbook.createCellStyle();
        Font fontInfo = workbook.createFont();
        fontInfo.setBold(true);
        styleInfo.setFont(fontInfo);

        CellStyle styleDatosComunes = createHeaderStyle(workbook, IndexedColors.GREY_25_PERCENT, false);
        CellStyle styleProduccion = createHeaderStyle(workbook, IndexedColors.LIGHT_GREEN, false);
        CellStyle styleSiembra = createHeaderStyle(workbook, IndexedColors.LIGHT_CORNFLOWER_BLUE, false);
        CellStyle styleCambio = createHeaderStyle(workbook, IndexedColors.LIGHT_ORANGE, false);
        CellStyle styleEntrada = createHeaderStyle(workbook, IndexedColors.LAVENDER, false);
        CellStyle styleDescargo = createHeaderStyle(workbook, IndexedColors.ROSE, false);
        
        CellStyle styleDatosComunesGrp = createHeaderStyle(workbook, IndexedColors.GREY_25_PERCENT, true);
        CellStyle styleProduccionGrp = createHeaderStyle(workbook, IndexedColors.LIGHT_GREEN, true);
        CellStyle styleSiembraGrp = createHeaderStyle(workbook, IndexedColors.LIGHT_CORNFLOWER_BLUE, true);
        CellStyle styleCambioGrp = createHeaderStyle(workbook, IndexedColors.LIGHT_ORANGE, true);
        CellStyle styleEntradaGrp = createHeaderStyle(workbook, IndexedColors.LAVENDER, true);
        CellStyle styleDescargoGrp = createHeaderStyle(workbook, IndexedColors.ROSE, true);

        // Fila 0
        Row row0 = sheet.createRow(0);
        row0.setHeightInPoints(20);
        Cell titleCell = row0.createCell(0);
        titleCell.setCellValue("BITÁCORA VENTA LOCAL");
        titleCell.setCellStyle(styleTitle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, totalCols - 1));

        // Fila 1
        Row row1 = sheet.createRow(1);
        Cell cVivero = row1.createCell(0); cVivero.setCellValue("VIVERO SONSONATE"); cVivero.setCellStyle(styleInfo);
        Cell cEncargado = row1.createCell(3); cEncargado.setCellValue("ENCARGADO: Generado por Sistema"); cEncargado.setCellStyle(styleInfo);
        Cell cMes = row1.createCell(finalDatosStart - 2); cMes.setCellValue("Mes: " + LocalDate.now().getMonth().name()); cMes.setCellStyle(styleInfo);
        Cell cAno = row1.createCell(finalDatosStart + 1); cAno.setCellValue("AÑO: " + LocalDate.now().getYear()); cAno.setCellStyle(styleInfo);

        // Fila 2 y 3: Grupos y Cabeceras
        Row row2 = sheet.createRow(2);
        row2.setHeightInPoints(20);
        Row row3 = sheet.createRow(3);
        row3.setHeightInPoints(30);

        // Datos Comunes
        for (int i=0; i<=4; i++) {
            row2.createCell(i).setCellValue("Datos");
            row2.getCell(i).setCellStyle(styleDatosComunesGrp);
            Cell c = row3.createCell(i); c.setCellStyle(styleDatosComunes);
        }
        sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, 4));
        row3.getCell(0).setCellValue("Fecha"); sheet.setColumnWidth(0, 1800);
        row3.getCell(1).setCellValue("Trabajador"); sheet.setColumnWidth(1, 2800);
        row3.getCell(2).setCellValue("Cant."); sheet.setColumnWidth(2, 1600);
        row3.getCell(3).setCellValue("Cortar Follaje"); sheet.setColumnWidth(3, 2500);
        row3.getCell(4).setCellValue("Cortar y sembrar Enraizador"); sheet.setColumnWidth(4, 2500);

        // Prod
        if (hasProd) {
            for(int i=prodStart; i<=prodEnd; i++) {
                row2.createCell(i).setCellValue("Producción"); row2.getCell(i).setCellStyle(styleProduccionGrp);
                Cell c = row3.createCell(i); c.setCellStyle(styleProduccion);
            }
            sheet.addMergedRegion(new CellRangeAddress(2, 2, prodStart, prodEnd));
            row3.getCell(prodStart).setCellValue("Nombre de la planta (Cantidad y tamaño)");
            row3.getCell(prodStart+1).setCellValue("Presentación (Maceta, bolsa, etc)");
            row3.getCell(prodStart+2).setCellValue("Origen de las plantas"); sheet.setColumnWidth(prodStart+2, 6000);
            row3.getCell(prodStart+3).setCellValue("Material utilizado"); sheet.setColumnWidth(prodStart+3, 2000);
            row3.getCell(prodStart+4).setCellValue("Siembra: Tiempo en horas"); sheet.setColumnWidth(prodStart+4, 2500);
        }

        // Siembra
        if (hasSiembra) {
            for(int i=siembraStart; i<=siembraEnd; i++) {
                row2.createCell(i).setCellValue("Siembra a Campo"); row2.getCell(i).setCellStyle(styleSiembraGrp);
                Cell c = row3.createCell(i); c.setCellStyle(styleSiembra);
            }
            sheet.addMergedRegion(new CellRangeAddress(2, 2, siembraStart, siembraEnd));
            row3.getCell(siembraStart).setCellValue("Sembrar a campo / Sacar de campo");
            row3.getCell(siembraStart+1).setCellValue("A campo: Lugar de siembra");
        }

        // Cambio
        if (hasCambio) {
            for(int i=cambioStart; i<=cambioEnd; i++) {
                row2.createCell(i).setCellValue("Cambio de Presentación"); row2.getCell(i).setCellStyle(styleCambioGrp);
                Cell c = row3.createCell(i); c.setCellStyle(styleCambio);
            }
            sheet.addMergedRegion(new CellRangeAddress(2, 2, cambioStart, cambioEnd));
            row3.getCell(cambioStart).setCellValue("Código antiguo");
            row3.getCell(cambioStart+1).setCellValue("Antigua presentación"); sheet.setColumnWidth(cambioStart+1, 6000);
            row3.getCell(cambioStart+2).setCellValue("Nueva Presentación");
        }

        // Entrada
        if (hasEntrada) {
            for(int i=entradaStart; i<=entradaEnd; i++) {
                row2.createCell(i).setCellValue("Entrada Exterior"); row2.getCell(i).setCellStyle(styleEntradaGrp);
                Cell c = row3.createCell(i); c.setCellStyle(styleEntrada);
            }
            sheet.addMergedRegion(new CellRangeAddress(2, 2, entradaStart, entradaEnd));
            row3.getCell(entradaStart).setCellValue("Tipo");
            row3.getCell(entradaStart+1).setCellValue("Detalle"); sheet.setColumnWidth(entradaStart+1, 6000);
            row3.getCell(entradaStart+2).setCellValue("Precio Total");
        }

        // Descargo
        if (hasDescargo) {
            row2.createCell(descargoStart).setCellValue("Descargo de plantas"); row2.getCell(descargoStart).setCellStyle(styleDescargoGrp);
            Cell c = row3.createCell(descargoStart); c.setCellStyle(styleDescargo);
            row3.getCell(descargoStart).setCellValue("Descargo de plantas (Motivo)"); sheet.setColumnWidth(descargoStart, 6000);
        }

        // Final Datos
        for (int i=finalDatosStart; i<=finalDatosEnd; i++) {
            row2.createCell(i).setCellValue("Datos"); row2.getCell(i).setCellStyle(styleDatosComunesGrp);
            Cell c = row3.createCell(i); c.setCellStyle(styleDatosComunes);
        }
        sheet.addMergedRegion(new CellRangeAddress(2, 2, finalDatosStart, finalDatosEnd));
        row3.getCell(finalDatosStart).setCellValue("Código");
        row3.getCell(finalDatosStart+1).setCellValue("Requisición");
        row3.getCell(finalDatosStart+2).setCellValue("Otras actividades");

        // Set default widths for empty cols if needed, but we already set specifically
        for (int i=0; i<totalCols; i++) {
            if (sheet.getColumnWidth(i) == sheet.getDefaultColumnWidth() * 256) sheet.setColumnWidth(i, 3500);
        }

        CellStyle styleDataWrap = createDataStyle(workbook, true);
        CellStyle styleDate = createDateStyle(workbook);

        List<MovimientoResumen> todos = new ArrayList<>();
        for (Produccion p : producciones) todos.add(new MovimientoResumen("produccion", p.getFecha(), p.getTrabajador().getNombre(), p.getCantidad(), p));
        for (CambioPresentacion c : cambios) todos.add(new MovimientoResumen("cambio", c.getFecha(), c.getTrabajador().getNombre(), c.getCantidadDestino(), c));
        for (Descargo d : descargos) todos.add(new MovimientoResumen("descargo", d.getFecha(), d.getTrabajador().getNombre(), d.getCantidad(), d));
        for (EntradaExterior e : entradas) todos.add(new MovimientoResumen("entrada", e.getFecha(), e.getTrabajador().getNombre(), e.getCantidad(), e));

        todos.sort(Comparator.comparing(MovimientoResumen::getFecha).reversed());

        int rowNum = 4;
        for (MovimientoResumen mov : todos) {
            Row row = sheet.createRow(rowNum++);
            
            for (int i=0; i<totalCols; i++) {
                Cell c = row.createCell(i);
                c.setCellStyle(styleDataWrap);
            }

            Cell dateCell = row.getCell(0);
            dateCell.setCellStyle(styleDate);
            if (mov.getFecha() != null) dateCell.setCellValue(mov.getFecha());
            
            row.getCell(1).setCellValue(mov.getTrabajador());
            row.getCell(2).setCellValue(mov.getCantidad());

            if (mov.getTipo().equals("produccion") && hasProd) {
                Produccion p = (Produccion) mov.getEntidad();
                String np = p.getPlantaPresentacion().getPlanta() != null ? p.getPlantaPresentacion().getPlanta().getNombre() : "Arreglo Combinado";
                boolean hasDetalle = p.getPlantaPresentacion().getDetalle() != null && !p.getPlantaPresentacion().getDetalle().isEmpty();
                boolean hasTamanio = p.getPlantaPresentacion().getTamanio() != null && !p.getPlantaPresentacion().getTamanio().isEmpty();
                if (hasDetalle) np += " " + p.getPlantaPresentacion().getDetalle();
                if (hasDetalle && hasTamanio) np += " de " + p.getPlantaPresentacion().getTamanio();
                else if (hasTamanio) np += " " + p.getPlantaPresentacion().getTamanio();
                row.getCell(prodStart).setCellValue(np);
                row.getCell(prodStart+1).setCellValue(p.getPlantaPresentacion().getPresentacion().getNombre());
                
                String origenesStr = p.getOrigenes().stream().map(Origen::getNombre).collect(Collectors.joining(", "));
                row.getCell(prodStart+2).setCellValue(origenesStr);
                row.getCell(prodStart+3).setCellValue(p.getCantidad() * (p.getPlantaPresentacion().getPresentacion().getCc() != null ? p.getPlantaPresentacion().getPresentacion().getCc() : 0));
                
                String horas = "";
                if (p.getSiembraTiempoHoras() != null) {
                    horas = (p.getSiembraTiempoHoras() == Math.floor(p.getSiembraTiempoHoras()) && !Double.isInfinite(p.getSiembraTiempoHoras()))
                            ? String.format(Locale.US, "%.0f", p.getSiembraTiempoHoras())
                            : p.getSiembraTiempoHoras().toString();
                }
                row.getCell(prodStart+4).setCellValue(horas.isEmpty() ? "" : horas + " horas");

                row.getCell(finalDatosStart).setCellValue(p.getPlantaPresentacion().getCodigo());
                row.getCell(finalDatosStart+1).setCellValue(p.getPlantaPresentacion().getPresentacion().getRequisicion() != null ? p.getPlantaPresentacion().getPresentacion().getRequisicion().toString() : "");
            
            } else if (mov.getTipo().equals("cambio") && hasCambio) {
                CambioPresentacion c = (CambioPresentacion) mov.getEntidad();
                if (c.getDetalles() != null && !c.getDetalles().isEmpty()) {
                    String codigosViejos = c.getDetalles().stream().map(d -> d.getOrigen().getCodigo()).collect(Collectors.joining(", "));
                    String presentacionesViejas = c.getDetalles().stream().map(d -> d.getCantidadOrigen() + " " + (d.getOrigen().getPlanta() != null ? d.getOrigen().getPlanta().getNombre() : "") + " " + d.getOrigen().getPresentacion().getNombre()).collect(Collectors.joining("\n"));
                    row.getCell(cambioStart).setCellValue(codigosViejos);
                    row.getCell(cambioStart+1).setCellValue(presentacionesViejas);
                }
                row.getCell(cambioStart+2).setCellValue(c.getDestino().getPresentacion().getNombre() + (c.getDestino().getEsArregloCombinado() ? " (Arreglo Combinado)" : ""));
                row.getCell(finalDatosStart).setCellValue(c.getDestino().getCodigo());
                row.getCell(finalDatosStart+1).setCellValue(c.getDestino().getPresentacion().getRequisicion() != null ? c.getDestino().getPresentacion().getRequisicion().toString() : "");
            } else if (mov.getTipo().equals("entrada") && hasEntrada) {
                EntradaExterior e = (EntradaExterior) mov.getEntidad();
                row.getCell(entradaStart).setCellValue(e.getTipo());
                row.getCell(entradaStart+1).setCellValue(e.getDetalle());
                if (e.getTotalPrecio() != null) row.getCell(entradaStart+2).setCellValue(e.getTotalPrecio());
                row.getCell(finalDatosStart).setCellValue(e.getPlantaPresentacion().getCodigo());
                row.getCell(finalDatosStart+1).setCellValue(e.getPlantaPresentacion().getPresentacion().getRequisicion() != null ? e.getPlantaPresentacion().getPresentacion().getRequisicion().toString() : "");
            } else if (mov.getTipo().equals("descargo") && hasDescargo) {
                Descargo d = (Descargo) mov.getEntidad();
                row.getCell(descargoStart).setCellValue(d.getMotivoDescargo());
                row.getCell(finalDatosStart).setCellValue(d.getPlantaPresentacion().getCodigo());
                row.getCell(finalDatosStart+1).setCellValue(d.getPlantaPresentacion().getPresentacion().getRequisicion() != null ? d.getPlantaPresentacion().getPresentacion().getRequisicion().toString() : "");
            }
        }
    }

    private void crearHojaProduccion(Workbook workbook, List<Produccion> producciones) {
        Sheet sheet = workbook.createSheet("Producción");
        sheet.createFreezePane(0, 1);
        CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.GREY_50_PERCENT, true);
        CellStyle styleDataWrap = createDataStyle(workbook, true);
        CellStyle styleDate = createDateStyle(workbook);

        Row header = sheet.createRow(0);
        String[] headers = {"Fecha", "Trabajador", "Código", "Cantidad", "Nombre de la planta", "Presentación", "Origen", "Material utilizado", "Tiempo siembra", "Requisición"};
        for (int i=0; i<headers.length; i++) {
            Cell c = header.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle);
            if (i == 0) sheet.setColumnWidth(i, 1800);
            else if (i == 1) sheet.setColumnWidth(i, 2800);
            else if (i == 2 || i == 3) sheet.setColumnWidth(i, 1600);
            else if (i == 6) sheet.setColumnWidth(i, 6000);
            else if (i == 7) sheet.setColumnWidth(i, 2000);
            else sheet.setColumnWidth(i, 3500);
        }

        if (producciones.isEmpty()) {
            Row row = sheet.createRow(1);
            Cell c = row.createCell(0); c.setCellValue("No hubo producciones registradas."); c.setCellStyle(styleDataWrap);
            for(int i=1;i<headers.length;i++) row.createCell(i).setCellStyle(styleDataWrap);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, headers.length - 1));
            return;
        }

        int rowNum = 1;
        for (Produccion p : producciones) {
            Row row = sheet.createRow(rowNum++);
            for(int i=0;i<headers.length;i++) row.createCell(i).setCellStyle(styleDataWrap);
            
            if (p.getFecha() != null) { Cell d = row.getCell(0); d.setCellValue(p.getFecha()); d.setCellStyle(styleDate); }
            row.getCell(1).setCellValue(p.getTrabajador().getNombre());
            row.getCell(2).setCellValue(p.getPlantaPresentacion().getCodigo());
            row.getCell(3).setCellValue(p.getCantidad());
            String np = p.getPlantaPresentacion().getPlanta() != null ? p.getPlantaPresentacion().getPlanta().getNombre() : "Arreglo Combinado";
            boolean hasDetalle = p.getPlantaPresentacion().getDetalle() != null && !p.getPlantaPresentacion().getDetalle().isEmpty();
            boolean hasTamanio = p.getPlantaPresentacion().getTamanio() != null && !p.getPlantaPresentacion().getTamanio().isEmpty();
            if (hasDetalle) np += " " + p.getPlantaPresentacion().getDetalle();
            if (hasDetalle && hasTamanio) np += " de " + p.getPlantaPresentacion().getTamanio();
            else if (hasTamanio) np += " " + p.getPlantaPresentacion().getTamanio();
            row.getCell(4).setCellValue(np);
            row.getCell(5).setCellValue(p.getPlantaPresentacion().getPresentacion().getNombre());
            String origenesStr = p.getOrigenes().stream().map(Origen::getNombre).collect(Collectors.joining(", "));
            row.getCell(6).setCellValue(origenesStr);
            row.getCell(7).setCellValue(p.getCantidad() * (p.getPlantaPresentacion().getPresentacion().getCc() != null ? p.getPlantaPresentacion().getPresentacion().getCc() : 0));
            
            String horas = "";
            if (p.getSiembraTiempoHoras() != null) {
                horas = (p.getSiembraTiempoHoras() == Math.floor(p.getSiembraTiempoHoras()) && !Double.isInfinite(p.getSiembraTiempoHoras()))
                        ? String.format(Locale.US, "%.0f", p.getSiembraTiempoHoras())
                        : p.getSiembraTiempoHoras().toString();
            }
            row.getCell(8).setCellValue(horas);
            row.getCell(9).setCellValue(p.getPlantaPresentacion().getPresentacion().getRequisicion() != null ? p.getPlantaPresentacion().getPresentacion().getRequisicion().toString() : "");
        }
    }

    private void crearHojaDescargo(Workbook workbook, List<Descargo> descargos) {
        Sheet sheet = workbook.createSheet("Descargo");
        sheet.createFreezePane(0, 1);
        CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.GREY_50_PERCENT, true);
        CellStyle styleDataWrap = createDataStyle(workbook, true);
        CellStyle styleDate = createDateStyle(workbook);

        Row header = sheet.createRow(0);
        String[] headers = {"Fecha", "Trabajador", "Cant.", "Motivo de descargo", "Código"};
        for (int i=0; i<headers.length; i++) {
            Cell c = header.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle);
            if (i == 0) sheet.setColumnWidth(i, 1800);
            else if (i == 1) sheet.setColumnWidth(i, 2800);
            else if (i == 2) sheet.setColumnWidth(i, 1600);
            else if (i == 3) sheet.setColumnWidth(i, 6000);
            else if (i == 7) sheet.setColumnWidth(i, 2000);
            else sheet.setColumnWidth(i, 3500);
        }

        if (descargos.isEmpty()) {
            Row row = sheet.createRow(1);
            Cell c = row.createCell(0); c.setCellValue("No hubo descargos registrados."); c.setCellStyle(styleDataWrap);
            for(int i=1;i<headers.length;i++) row.createCell(i).setCellStyle(styleDataWrap);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, headers.length - 1));
            return;
        }

        int rowNum = 1;
        for (Descargo d : descargos) {
            Row row = sheet.createRow(rowNum++);
            for(int i=0;i<headers.length;i++) row.createCell(i).setCellStyle(styleDataWrap);
            
            if (d.getFecha() != null) { Cell dc = row.getCell(0); dc.setCellValue(d.getFecha()); dc.setCellStyle(styleDate); }
            row.getCell(1).setCellValue(d.getTrabajador().getNombre());
            row.getCell(2).setCellValue(d.getCantidad());
            row.getCell(3).setCellValue(d.getMotivoDescargo());
            row.getCell(4).setCellValue(d.getPlantaPresentacion().getCodigo());
        }
    }

    private void crearHojaCambio(Workbook workbook, List<CambioPresentacion> cambios) {
        Sheet sheet = workbook.createSheet("Cambio de presentación");
        sheet.createFreezePane(0, 1);
        CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.GREY_50_PERCENT, true);
        CellStyle styleDataWrap = createDataStyle(workbook, true);
        CellStyle styleDate = createDateStyle(workbook);

        Row header = sheet.createRow(0);
        String[] headers = {"Fecha", "Trabajador", "Cant.", "Código antiguo", "Antigua presentación", "Nueva Presentación", "Código nuevo"};
        for (int i=0; i<headers.length; i++) {
            Cell c = header.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle);
            if (i == 0) sheet.setColumnWidth(i, 1800);
            else if (i == 1) sheet.setColumnWidth(i, 2800);
            else if (i == 2) sheet.setColumnWidth(i, 1600);
            else if (i == 4 || i == 5) sheet.setColumnWidth(i, 6000);
            else if (i == 7) sheet.setColumnWidth(i, 2000);
            else sheet.setColumnWidth(i, 3500);
        }

        if (cambios.isEmpty()) {
            Row row = sheet.createRow(1);
            Cell c = row.createCell(0); c.setCellValue("No hubo cambios de presentación registrados."); c.setCellStyle(styleDataWrap);
            for(int i=1;i<headers.length;i++) row.createCell(i).setCellStyle(styleDataWrap);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, headers.length - 1));
            return;
        }

        int rowNum = 1;
        for (CambioPresentacion c : cambios) {
            if (c.getDetalles() != null) {
                int index = 0;
                for (CambioPresentacionDetalle det : c.getDetalles()) {
                    Row row = sheet.createRow(rowNum++);
                    for(int i=0;i<headers.length;i++) row.createCell(i).setCellStyle(styleDataWrap);

                    if (c.getFecha() != null) { Cell dc = row.getCell(0); dc.setCellValue(c.getFecha()); dc.setCellStyle(styleDate); }
                    row.getCell(1).setCellValue(c.getTrabajador().getNombre());
                    
                    if (index == c.getDetalles().size() - 1) {
                        row.getCell(2).setCellValue(c.getCantidadDestino());
                        row.getCell(5).setCellValue(c.getDestino().getPresentacion().getNombre() + (c.getDestino().getEsArregloCombinado() ? " (Arreglo Combinado)" : ""));
                        row.getCell(6).setCellValue(c.getDestino().getCodigo());
                    }
                    
                    row.getCell(3).setCellValue(det.getOrigen().getCodigo());
                    row.getCell(4).setCellValue(det.getCantidadOrigen() + " " + (det.getOrigen().getPlanta() != null ? det.getOrigen().getPlanta().getNombre() : "") + " " + det.getOrigen().getPresentacion().getNombre());
                    index++;
                }
            }
        }
    }

    private void crearHojaEntradaExterior(Workbook workbook, List<EntradaExterior> entradas) {
        Sheet sheet = workbook.createSheet("Entrada Exterior");
        sheet.createFreezePane(0, 1);
        CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.GREY_50_PERCENT, true);
        CellStyle styleDataWrap = createDataStyle(workbook, true);
        CellStyle styleDate = createDateStyle(workbook);

        Row header = sheet.createRow(0);
        String[] headers = {"Fecha", "Trabajador", "Cant.", "Tipo", "Detalle", "Precio Total", "Código"};
        for (int i=0; i<headers.length; i++) {
            Cell c = header.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle);
            if (i == 0) sheet.setColumnWidth(i, 1800);
            else if (i == 1) sheet.setColumnWidth(i, 2800);
            else if (i == 2) sheet.setColumnWidth(i, 1600);
            else if (i == 4) sheet.setColumnWidth(i, 6000);
            else if (i == 7) sheet.setColumnWidth(i, 2000);
            else sheet.setColumnWidth(i, 3500);
        }

        if (entradas.isEmpty()) {
            Row row = sheet.createRow(1);
            Cell c = row.createCell(0); c.setCellValue("No hubo entradas exteriores registradas."); c.setCellStyle(styleDataWrap);
            for(int i=1;i<headers.length;i++) row.createCell(i).setCellStyle(styleDataWrap);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, headers.length - 1));
            return;
        }

        int rowNum = 1;
        for (EntradaExterior e : entradas) {
            Row row = sheet.createRow(rowNum++);
            for(int i=0;i<headers.length;i++) row.createCell(i).setCellStyle(styleDataWrap);

            if (e.getFecha() != null) { Cell dc = row.getCell(0); dc.setCellValue(e.getFecha()); dc.setCellStyle(styleDate); }
            row.getCell(1).setCellValue(e.getTrabajador().getNombre());
            row.getCell(2).setCellValue(e.getCantidad());
            row.getCell(3).setCellValue(e.getTipo());
            row.getCell(4).setCellValue(e.getDetalle());
            if (e.getTotalPrecio() != null) row.getCell(5).setCellValue(e.getTotalPrecio());
            row.getCell(6).setCellValue(e.getPlantaPresentacion().getCodigo());
        }
    }

    private void crearHojaConstantes(Workbook workbook, List<Presentacion> presentaciones) {
        Sheet sheet = workbook.createSheet("Sustrato");
        sheet.createFreezePane(0, 2);
        
        CellStyle styleTitle = workbook.createCellStyle();
        Font fontTitle = workbook.createFont(); fontTitle.setBold(true);  styleTitle.setFont(fontTitle);
        
        CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.GREY_25_PERCENT, true);
        CellStyle styleData = createDataStyle(workbook, false);

        Row title = sheet.createRow(0); Cell tc = title.createCell(0); tc.setCellValue("Cantidades de sustrato por depositos"); tc.setCellStyle(styleTitle);

        Row header = sheet.createRow(1);
        String[] headers = {"Presentación", "Cantidad de sustrato (cc)", "Requisición"};
        for(int i=0;i<headers.length;i++) { Cell c = header.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle); sheet.setColumnWidth(i, 6000); }

        int rowNum = 2;
        for (Presentacion p : presentaciones) {
            Row row = sheet.createRow(rowNum++);
            for(int i=0;i<headers.length;i++) row.createCell(i).setCellStyle(styleData);
            row.getCell(0).setCellValue(p.getNombre());
            row.getCell(1).setCellValue(p.getCc() != null ? p.getCc() : 0);
            row.getCell(2).setCellValue(p.getRequisicion() != null ? p.getRequisicion() : 0);
        }
    }

    private static class MovimientoResumen {
        private String tipo; private LocalDate fecha; private String trabajador; private Integer cantidad; private Object entidad;
        public MovimientoResumen(String tipo, LocalDate fecha, String trabajador, Integer cantidad, Object entidad) { this.tipo = tipo; this.fecha = fecha; this.trabajador = trabajador; this.cantidad = cantidad; this.entidad = entidad; }
        public String getTipo() { return tipo; } public LocalDate getFecha() { return fecha; } public String getTrabajador() { return trabajador; } public Integer getCantidad() { return cantidad; } public Object getEntidad() { return entidad; }
    }
}
