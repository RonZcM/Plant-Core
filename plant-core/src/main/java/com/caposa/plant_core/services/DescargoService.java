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
        // 1. Guardar el registro en la bitácora de descargos
        Descargo descargoGuardado = descargoRepo.save(nuevoDescargo);

        // 2. Extraer datos para afectar el inventario
        Long plantaId = descargoGuardado.getPlantaPresentacion().getPlanta().getId();
        Long presentacionId = descargoGuardado.getPlantaPresentacion().getPresentacion().getId();
        Integer cantidadMermada = descargoGuardado.getCantidad();

        // 3. Restar la cantidad del inventario (si no hay suficiente, el InventarioService lanzará un error y cancelará todo)
        inventarioService.restarStock(plantaId, presentacionId, cantidadMermada);

        return descargoGuardado;
    }
}