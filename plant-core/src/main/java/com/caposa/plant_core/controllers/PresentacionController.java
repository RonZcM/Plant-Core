package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.Presentacion;
import com.caposa.plant_core.repositories.PresentacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/presentaciones")
@CrossOrigin(origins = "*")
public class PresentacionController {

    @Autowired
    private PresentacionRepository presentacionRepo;

    @GetMapping
    public List<Presentacion> obtenerTodas() {
        return presentacionRepo.findAll();
    }

    // CREAR (POST)
    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Presentacion presentacion) {
        try {
            if (presentacionRepo.findByCodigo(presentacion.getCodigo()).isPresent()) {
                return ResponseEntity.badRequest().body("El código / ref '" + presentacion.getCodigo() + "' ya está registrado en otra presentación.");
            }
            Presentacion nueva = presentacionRepo.save(presentacion);
            return ResponseEntity.ok(nueva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar presentación: " + e.getMessage());
        }
    }

    // EDITAR (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Presentacion actualizada) {
        try {
            Optional<Presentacion> existente = presentacionRepo.findByCodigo(actualizada.getCodigo());
            if (existente.isPresent() && !existente.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("El código / ref '" + actualizada.getCodigo() + "' ya está en uso.");
            }

            return presentacionRepo.findById(id).map(pres -> {
                pres.setCodigo(actualizada.getCodigo());
                pres.setNombre(actualizada.getNombre());
                pres.setCc(actualizada.getCc());
                pres.setRequisicion(actualizada.getRequisicion());
                return ResponseEntity.ok(presentacionRepo.save(pres));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar presentación: " + e.getMessage());
        }
    }

    // ELIMINAR (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return presentacionRepo.findById(id).map(pres -> {
            presentacionRepo.delete(pres);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}