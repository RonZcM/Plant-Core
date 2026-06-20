package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.PlantaPresentacion;
import com.caposa.plant_core.repositories.PlantaPresentacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
@CrossOrigin(origins = "*")
public class InventarioController {

    @Autowired
    private PlantaPresentacionRepository inventarioRepo;

    // GET: http://localhost:8080/api/inventario
    @GetMapping
    public List<PlantaPresentacion> obtenerInventario() {
        return inventarioRepo.findAll();
    }
}