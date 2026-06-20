package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.Empleado;
import com.caposa.plant_core.repositories.EmpleadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/empleados")
@CrossOrigin(origins = "*")
public class EmpleadoController {

    @Autowired
    private EmpleadoRepository empleadoRepo;

    @GetMapping
    public List<Empleado> obtenerTodos() {
        return empleadoRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Empleado empleado) {
        try {
            if (empleadoRepo.findByDui(empleado.getDui()).isPresent()) {
                return ResponseEntity.badRequest().body("El DUI " + empleado.getDui() + " ya está registrado.");
            }
            return ResponseEntity.ok(empleadoRepo.save(empleado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar empleado: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Empleado actualizado) {
        try {
            Optional<Empleado> existente = empleadoRepo.findByDui(actualizado.getDui());
            if (existente.isPresent() && !existente.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("El DUI " + actualizado.getDui() + " ya está en uso por otro empleado.");
            }

            return empleadoRepo.findById(id).map(emp -> {
                emp.setNombre(actualizado.getNombre());
                emp.setApellido(actualizado.getApellido());
                emp.setDui(actualizado.getDui());
                emp.setNumero(actualizado.getNumero());
                emp.setFechaContratacion(actualizado.getFechaContratacion());
                return ResponseEntity.ok(empleadoRepo.save(emp));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return empleadoRepo.findById(id).map(emp -> {
            empleadoRepo.delete(emp);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}