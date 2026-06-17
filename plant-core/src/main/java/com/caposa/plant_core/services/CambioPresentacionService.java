package com.caposa.plant_core.services;

import com.caposa.plant_core.models.CambioPresentacion;
import com.caposa.plant_core.repositories.CambioPresentacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CambioPresentacionService {

    @Autowired
    private CambioPresentacionRepository cambioRepo;

    @Autowired
    private InventarioService inventarioService;

    @Transactional
    public CambioPresentacion registrarCambio(CambioPresentacion nuevoCambio) {
        // 1. Guardar el registro histórico
        CambioPresentacion cambioGuardado = cambioRepo.save(nuevoCambio);

        // 2. Extraer datos del Origen (de dónde sale la planta)
        Long origenPlantaId = cambioGuardado.getOrigen().getPlanta().getId();
        Long origenPresentacionId = cambioGuardado.getOrigen().getPresentacion().getId();

        // 3. Extraer datos del Destino (a dónde entra la planta)
        Long destinoPlantaId = cambioGuardado.getDestino().getPlanta().getId();
        Long destinoPresentacionId = cambioGuardado.getDestino().getPresentacion().getId();

        Integer cantidad = cambioGuardado.getCantidad();

        // 4. Ejecutar el movimiento de inventario doble
        // Restamos del origen...
        inventarioService.restarStock(origenPlantaId, origenPresentacionId, cantidad);

        // ...y sumamos al destino
        inventarioService.agregarStock(destinoPlantaId, destinoPresentacionId, cantidad);

        return cambioGuardado;
    }
}