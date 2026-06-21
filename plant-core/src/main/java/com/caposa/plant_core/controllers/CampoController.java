package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.*;
import com.caposa.plant_core.models.dto.CampoRequest;
import com.caposa.plant_core.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campo")
@CrossOrigin(origins = "*")
public class CampoController {

    @Autowired private CampoRepository campoRepo;
    @Autowired private PlantaPresentacionRepository ppRepo;
    @Autowired private EmpleadoRepository empleadoRepo;
    @Autowired private OrigenRepository origenRepo;

    @GetMapping
    public List<Campo> getAll() {
        return campoRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CampoRequest req) {
        PlantaPresentacion pp = ppRepo.findById(req.getPlantaPresentacionId()).orElse(null);
        if (pp == null) {
            return ResponseEntity.badRequest().body("Vínculo de inventario no encontrado.");
        }

        if (req.getCantidad() == null || req.getCantidad() <= 0) {
            return ResponseEntity.badRequest().body("La cantidad debe ser mayor a 0.");
        }

        if ("Salida".equals(req.getTipo())) {
            if (pp.getStock() < req.getCantidad()) {
                return ResponseEntity.badRequest().body("No hay suficiente stock para sembrar a campo. Stock actual: " + pp.getStock());
            }
            pp.setStock(pp.getStock() - req.getCantidad());
        } else if ("Entrada".equals(req.getTipo())) {
            pp.setStock(pp.getStock() + req.getCantidad());
        } else {
            return ResponseEntity.badRequest().body("Tipo de operación inválido. Debe ser 'Salida' o 'Entrada'.");
        }

        ppRepo.save(pp);

        Campo campo = new Campo();
        campo.setFecha(req.getFecha());
        campo.setTipo(req.getTipo());
        campo.setCantidad(req.getCantidad());
        campo.setPlantaPresentacion(pp);
        
        if (req.getTrabajadorIds() != null && !req.getTrabajadorIds().isEmpty()) {
            campo.setTrabajadores(empleadoRepo.findAllById(req.getTrabajadorIds()));
        }
        
        if (req.getLugarIds() != null && !req.getLugarIds().isEmpty()) {
            campo.setLugares(origenRepo.findAllById(req.getLugarIds()));
        }

        Campo saved = campoRepo.save(campo);
        return ResponseEntity.ok(saved);
    }
}
