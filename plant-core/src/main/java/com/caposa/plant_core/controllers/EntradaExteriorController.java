package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.EntradaExterior;
import com.caposa.plant_core.repositories.EntradaExteriorRepository;
import com.caposa.plant_core.services.EntradaExteriorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entradas-exteriores")
@CrossOrigin(origins = "*")
public class EntradaExteriorController {

    @Autowired
    private EntradaExteriorService entradaService;

    @Autowired
    private EntradaExteriorRepository entradaRepo;

    @GetMapping
    public List<EntradaExterior> obtenerTodas() {
        return entradaRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody EntradaExterior entrada) {
        try {
            EntradaExterior nueva = entradaService.registrarEntrada(entrada);
            return ResponseEntity.ok(nueva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar entrada: " + e.getMessage());
        }
    }
}