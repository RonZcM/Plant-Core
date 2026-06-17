package com.caposa.plant_core.services;

import com.caposa.plant_core.models.PlantaPresentacion;
import com.caposa.plant_core.repositories.PlantaPresentacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventarioService {

    @Autowired
    private PlantaPresentacionRepository inventarioRepo;

    // Método para sumar stock (Ej: Cuando hay una nueva Producción)
    @Transactional
    public PlantaPresentacion agregarStock(Long plantaId, Long presentacionId, Integer cantidad) {
        // Buscamos si ya existe esta planta en esta maceta/bolsa
        PlantaPresentacion inventario = inventarioRepo.findByPlantaIdAndPresentacionId(plantaId, presentacionId)
                .orElseThrow(() -> new RuntimeException("No existe registro en inventario para esta Planta y Presentación. Por favor, asócielos primero en el catálogo."));

        inventario.setInventario(inventario.getInventario() + cantidad);
        return inventarioRepo.save(inventario);
    }

    // Método para restar stock (Ej: Descargos o Siembra a Campo)
    @Transactional
    public PlantaPresentacion restarStock(Long plantaId, Long presentacionId, Integer cantidad) {
        PlantaPresentacion inventario = inventarioRepo.findByPlantaIdAndPresentacionId(plantaId, presentacionId)
                .orElseThrow(() -> new RuntimeException("No se encontró el inventario para la planta seleccionada."));

        // Validación de negocio crucial para el vivero
        if (inventario.getInventario() < cantidad) {
            throw new RuntimeException("Stock insuficiente. No puedes descargar " + cantidad +
                    " porque solo hay " + inventario.getInventario() + " disponibles.");
        }

        inventario.setInventario(inventario.getInventario() - cantidad);
        return inventarioRepo.save(inventario);
    }
}