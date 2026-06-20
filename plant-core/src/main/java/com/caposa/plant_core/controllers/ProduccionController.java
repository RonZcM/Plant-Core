package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.Produccion;
import com.caposa.plant_core.repositories.ProduccionRepository;
import com.caposa.plant_core.services.ProduccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produccion")
@CrossOrigin(origins = "*") // Permite peticiones desde React (localhost:3000 o Vite)
public class ProduccionController {

    @Autowired
    private ProduccionService produccionService;

    @Autowired
    private ProduccionRepository produccionRepo;

    // GET: http://localhost:8080/api/produccion
    @GetMapping
    public List<Produccion> obtenerTodas() {
        return produccionRepo.findAll();
    }

    // POST: http://localhost:8080/api/produccion
    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Produccion produccion) {
        try {
            // Usamos el servicio porque tiene la transacción que actualiza el inventario
            Produccion nueva = produccionService.registrarProduccion(produccion);
            return ResponseEntity.ok(nueva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar producción: " + e.getMessage());
        }
    }
}