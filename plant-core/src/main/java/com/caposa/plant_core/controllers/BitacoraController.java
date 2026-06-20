package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.*;
import com.caposa.plant_core.models.dto.MovimientoDTO;
import com.caposa.plant_core.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

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
            dto.setDetalle("Siembra de: [" + p.getPlantaPresentacion().getCodigo() + "] - Origen: " + p.getOrigen().getNombre());
            dto.setCantidad(p.getCantidad());
            dto.setFechaRegistro(p.getCreatedAt());
            historial.add(dto);
        }

        // 2. Trasplantes (Cambios)
        for (CambioPresentacion c : cambioRepo.findAll()) {
            MovimientoDTO dto = new MovimientoDTO();
            dto.setIdOperacion("TRAS-" + c.getId());
            dto.setTipo("Trasplante");
            dto.setFecha(c.getFecha());
            dto.setEmpleado(c.getTrabajador().getNombre() + " " + c.getTrabajador().getApellido());
            dto.setDetalle("De: [" + c.getOrigen().getCodigo() + "] hacia: [" + c.getDestino().getCodigo() + "]");
            dto.setCantidad(c.getCantidad());
            dto.setFechaRegistro(c.getCreatedAt());
            historial.add(dto);
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
}