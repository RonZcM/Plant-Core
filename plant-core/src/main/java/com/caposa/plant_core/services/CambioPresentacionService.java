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
        if (nuevoCambio.getCantidadDestino() == null || nuevoCambio.getCantidadDestino() <= 0) {
            throw new IllegalArgumentException("La cantidad destino debe ser mayor a 0.");
        }
        
        // Asegurarnos de que el padre esté asignado a los hijos para el guardado en cascada
        if (nuevoCambio.getDetalles() != null) {
            for (com.caposa.plant_core.models.CambioPresentacionDetalle det : nuevoCambio.getDetalles()) {
                if (det.getCantidadOrigen() == null || det.getCantidadOrigen() <= 0) {
                    throw new IllegalArgumentException("La cantidad de origen debe ser mayor a 0.");
                }
                det.setCambioPresentacion(nuevoCambio);
            }
        }

        CambioPresentacion cambioGuardado = cambioRepo.save(nuevoCambio);

        Long destinoId = cambioGuardado.getDestino().getId();
        Integer cantidadDestino = cambioGuardado.getCantidadDestino();

        // Sumamos al destino
        inventarioService.agregarStock(destinoId, cantidadDestino);

        // Restamos a cada origen
        if (cambioGuardado.getDetalles() != null) {
            for (com.caposa.plant_core.models.CambioPresentacionDetalle det : cambioGuardado.getDetalles()) {
                inventarioService.restarStock(det.getOrigen().getId(), det.getCantidadOrigen());
            }
        }

        return cambioGuardado;
    }
}