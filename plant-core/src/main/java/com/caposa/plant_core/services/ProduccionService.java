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
        // 1. Guardamos el registro histórico en la bitácora de producción
        Produccion produccionGuardada = produccionRepo.save(nuevaProduccion);

        // 2. Extraemos los IDs necesarios para actualizar el inventario maestro
        Long plantaId = produccionGuardada.getPlantaPresentacion().getPlanta().getId();
        Long presentacionId = produccionGuardada.getPlantaPresentacion().getPresentacion().getId();
        Integer cantidadProducida = produccionGuardada.getCantidad();

        // 3. Llamamos a nuestro servicio de inventario para que sume el stock automáticamente
        inventarioService.agregarStock(plantaId, presentacionId, cantidadProducida);

        return produccionGuardada;
    }
}