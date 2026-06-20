package com.caposa.plant_core.services;

import com.caposa.plant_core.models.Descargo;
import com.caposa.plant_core.repositories.DescargoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DescargoService {

    @Autowired
    private DescargoRepository descargoRepo;

    @Autowired
    private InventarioService inventarioService;

    @Transactional
    public Descargo registrarDescargo(Descargo nuevoDescargo) {
        Descargo descargoGuardado = descargoRepo.save(nuevoDescargo);

        Long idInventario = descargoGuardado.getPlantaPresentacion().getId();
        Integer cantidadMermada = descargoGuardado.getCantidad();

        inventarioService.restarStock(idInventario, cantidadMermada);

        return descargoGuardado;
    }
}