package com.caposa.plant_core.services;

import com.caposa.plant_core.models.Produccion;
import com.caposa.plant_core.repositories.ProduccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProduccionService {

    @Autowired
    private ProduccionRepository produccionRepo;

    @Autowired
    private InventarioService inventarioService;

    @Transactional
    public Produccion registrarProduccion(Produccion nuevaProduccion) {
        Produccion produccionGuardada = produccionRepo.save(nuevaProduccion);

        // Extraemos solo el ID maestro del inventario
        Long idInventario = produccionGuardada.getPlantaPresentacion().getId();
        Integer cantidadProducida = produccionGuardada.getCantidad();

        inventarioService.agregarStock(idInventario, cantidadProducida);

        return produccionGuardada;
    }
}