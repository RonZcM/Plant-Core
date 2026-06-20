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

    @Transactional
    public PlantaPresentacion agregarStock(Long id, Integer cantidad) {
        PlantaPresentacion inv = inventarioRepo.findById(id).orElseThrow(() -> new RuntimeException("No existe el vínculo"));
        inv.setStock(inv.getStock() + cantidad);
        return inventarioRepo.save(inv);
    }

    @Transactional
    public PlantaPresentacion restarStock(Long id, Integer cantidad) {
        PlantaPresentacion inv = inventarioRepo.findById(id).orElseThrow(() -> new RuntimeException("No existe el vínculo"));
        if (inv.getStock() < cantidad) {
            throw new RuntimeException("Stock insuficiente.");
        }
        inv.setStock(inv.getStock() - cantidad);
        return inventarioRepo.save(inv);
    }
}