package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.Descargo;
import com.caposa.plant_core.repositories.DescargoRepository;
import com.caposa.plant_core.services.DescargoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/descargos")
@CrossOrigin(origins = "*")
public class DescargoController {

    @Autowired
    private DescargoService descargoService;

    @Autowired
    private DescargoRepository descargoRepo;

    @GetMapping
    public List<Descargo> obtenerTodos() {
        return descargoRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Descargo descargo) {
        try {
            Descargo nuevo = descargoService.registrarDescargo(descargo);
            return ResponseEntity.ok(nuevo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar descargo: " + e.getMessage());
        }
    }
}