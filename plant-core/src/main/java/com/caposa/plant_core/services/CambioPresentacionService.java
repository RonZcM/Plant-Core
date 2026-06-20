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
        CambioPresentacion cambioGuardado = cambioRepo.save(nuevoCambio);

        Long origenId = cambioGuardado.getOrigen().getId();
        Long destinoId = cambioGuardado.getDestino().getId();
        Integer cantidad = cambioGuardado.getCantidad();

        // Restamos del origen y sumamos al destino usando sus respectivos IDs de inventario
        inventarioService.restarStock(origenId, cantidad);
        inventarioService.agregarStock(destinoId, cantidad);

        return cambioGuardado;
    }
}