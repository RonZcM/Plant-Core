package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.Origen;
import com.caposa.plant_core.repositories.OrigenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/origenes")
@CrossOrigin(origins = "*")
public class OrigenController {

    @Autowired
    private OrigenRepository origenRepo;

    @GetMapping
    public List<Origen> obtenerTodos() {
        return origenRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Origen origen) {
        try {
            if (origenRepo.findByCodigo(origen.getCodigo()).isPresent()) {
                return ResponseEntity.badRequest().body("El código '" + origen.getCodigo() + "' ya está registrado.");
            }
            return ResponseEntity.ok(origenRepo.save(origen));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar origen: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Origen actualizado) {
        try {
            Optional<Origen> existente = origenRepo.findByCodigo(actualizado.getCodigo());
            if (existente.isPresent() && !existente.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("El código '" + actualizado.getCodigo() + "' ya está en uso.");
            }

            return origenRepo.findById(id).map(origen -> {
                origen.setCodigo(actualizado.getCodigo());
                origen.setNombre(actualizado.getNombre());
                return ResponseEntity.ok(origenRepo.save(origen));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar origen: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return origenRepo.findById(id).map(origen -> {
            origenRepo.delete(origen);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}