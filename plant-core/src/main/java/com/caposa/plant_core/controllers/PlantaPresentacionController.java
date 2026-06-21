package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.PlantaPresentacion;
import com.caposa.plant_core.repositories.PlantaPresentacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planta-presentacion")
@CrossOrigin(origins = "*")
public class PlantaPresentacionController {

    @Autowired
    private PlantaPresentacionRepository inventarioRepo;

    @GetMapping
    public List<PlantaPresentacion> obtenerTodos() {
        return inventarioRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody PlantaPresentacion pp) {
        try {
            if (pp.getPlanta() != null && inventarioRepo.existsByPlantaIdAndPresentacionId(pp.getPlanta().getId(), pp.getPresentacion().getId())) {
                return ResponseEntity.badRequest().body("Este vínculo ya existe.");
            }
            if (pp.getCodigo() != null && inventarioRepo.existsByCodigo(pp.getCodigo())) {
                return ResponseEntity.badRequest().body("El código de inventario ya está en uso.");
            }

            if (pp.getStock() == null) {
                pp.setStock(0);
            }
            return ResponseEntity.ok(inventarioRepo.save(pp));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return inventarioRepo.findById(id).map(pp -> {
            // 2. Proteger el inventario (No borrar si hay plantas vivas ahí)
            if (pp.getStock() != null && pp.getStock() > 0) {
                return ResponseEntity.badRequest().body("No puedes eliminar este vínculo porque aún hay " + pp.getStock() + " unidades en stock.");
            }
            inventarioRepo.delete(pp);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}