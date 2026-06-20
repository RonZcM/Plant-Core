package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.CambioPresentacion;
import com.caposa.plant_core.repositories.CambioPresentacionRepository;
import com.caposa.plant_core.services.CambioPresentacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cambios-presentacion")
@CrossOrigin(origins = "*")
public class CambioPresentacionController {

    @Autowired
    private CambioPresentacionService cambioService;

    @Autowired
    private CambioPresentacionRepository cambioRepo;

    @GetMapping
    public List<CambioPresentacion> obtenerTodos() {
        return cambioRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody CambioPresentacion cambio) {
        try {
            CambioPresentacion nuevo = cambioService.registrarCambio(cambio);
            return ResponseEntity.ok(nuevo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar cambio de presentación: " + e.getMessage());
        }
    }
}