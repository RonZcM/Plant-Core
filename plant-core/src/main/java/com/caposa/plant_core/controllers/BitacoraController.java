package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.*;
import com.caposa.plant_core.models.dto.MovimientoDTO;
import com.caposa.plant_core.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bitacora")
@CrossOrigin(origins = "*")
public class BitacoraController {

    @Autowired private ProduccionRepository produccionRepo;
    @Autowired private CambioPresentacionRepository cambioRepo;
    @Autowired private DescargoRepository descargoRepo;
    @Autowired private EntradaExteriorRepository entradaRepo;

    @GetMapping
    public List<MovimientoDTO> obtenerHistorial() {
        List<MovimientoDTO> historial = new ArrayList<>();

        // 1. Producciones
        for (Produccion p : produccionRepo.findAll()) {
            MovimientoDTO dto = new MovimientoDTO();
            dto.setIdOperacion("PROD-" + p.getId());
            dto.setTipo("Producción");
            dto.setFecha(p.getFecha());
            dto.setEmpleado(p.getTrabajador().getNombre() + " " + p.getTrabajador().getApellido());
            String origenesNombres = p.getOrigenes().stream().map(Origen::getNombre).collect(Collectors.joining(", "));
            dto.setDetalle("Siembra de: [" + p.getPlantaPresentacion().getCodigo() + "] - Orígenes: " + origenesNombres);
            dto.setCantidad(p.getCantidad());
            dto.setFechaRegistro(p.getCreatedAt());
            historial.add(dto);
        }

        // 2. Trasplantes (Cambios)
        for (CambioPresentacion c : cambioRepo.findAll()) {
            if (c.getDetalles() != null && !c.getDetalles().isEmpty()) {
                for (com.caposa.plant_core.models.CambioPresentacionDetalle det : c.getDetalles()) {
                    MovimientoDTO dto = new MovimientoDTO();
                    dto.setIdOperacion("TRAS-" + c.getId() + "-" + det.getId());
                    dto.setTipo("Cambio Presentación");
                    dto.setFecha(c.getFecha());
                    dto.setEmpleado(c.getTrabajador().getNombre() + " " + c.getTrabajador().getApellido());
                    dto.setDetalle("De: [" + det.getOrigen().getCodigo() + "] (" + det.getCantidadOrigen() + ") hacia: [" + c.getDestino().getCodigo() + "]");
                    // En la bitácora simplificada (UI) ponemos la cantidad que salió de la planta origen o destino?
                    // Mejor mostramos la cantidad final generada si es la primera fila, o simplemente referimos al destino
                    dto.setCantidad(c.getCantidadDestino());
                    dto.setFechaRegistro(c.getCreatedAt());
                    historial.add(dto);
                }
            } else {
                // Fallback por si hay un registro viejo sin detalles (migración)
                MovimientoDTO dto = new MovimientoDTO();
                dto.setIdOperacion("TRAS-" + c.getId());
                dto.setTipo("Cambio Presentación");
                dto.setFecha(c.getFecha());
                dto.setEmpleado(c.getTrabajador().getNombre() + " " + c.getTrabajador().getApellido());
                dto.setDetalle("Hacia: [" + c.getDestino().getCodigo() + "]");
                dto.setCantidad(c.getCantidadDestino());
                dto.setFechaRegistro(c.getCreatedAt());
                historial.add(dto);
            }
        }

        // 3. Descargos
        for (Descargo d : descargoRepo.findAll()) {
            MovimientoDTO dto = new MovimientoDTO();
            dto.setIdOperacion("BAJA-" + d.getId());
            dto.setTipo("Descargo");
            dto.setFecha(d.getFecha());
            dto.setEmpleado(d.getTrabajador().getNombre() + " " + d.getTrabajador().getApellido());
            dto.setDetalle("Lote: [" + d.getPlantaPresentacion().getCodigo() + "] - Motivo: " + d.getMotivoDescargo());
            dto.setCantidad(d.getCantidad());
            dto.setFechaRegistro(d.getCreatedAt());
            historial.add(dto);
        }

        // 4. Entradas Exteriores
        for (EntradaExterior e : entradaRepo.findAll()) {
            MovimientoDTO dto = new MovimientoDTO();
            dto.setIdOperacion("ENT-" + e.getId());
            dto.setTipo("Entrada Exterior");
            dto.setFecha(e.getFecha());
            dto.setEmpleado(e.getTrabajador().getNombre() + " " + e.getTrabajador().getApellido());
            dto.setDetalle("Lote: [" + e.getPlantaPresentacion().getCodigo() + "] - Tipo: " + e.getTipo());
            dto.setCantidad(e.getCantidad());
            dto.setFechaRegistro(e.getCreatedAt());
            historial.add(dto);
        }

        // Ordenar por fecha de registro (Los más recientes primero)
        historial.sort(Comparator.comparing(MovimientoDTO::getFechaRegistro, Comparator.nullsLast(Comparator.reverseOrder())));

        return historial;
    }

    @Autowired private com.caposa.plant_core.services.ExcelExportService excelExportService;

    @GetMapping("/exportar")
    public org.springframework.http.ResponseEntity<byte[]> exportarExcel() {
        try {
            byte[] excelContent = excelExportService.exportarBitacora();

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "bitacora.xlsx");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new org.springframework.http.ResponseEntity<>(excelContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (java.io.IOException e) {
            return new org.springframework.http.ResponseEntity<>(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}