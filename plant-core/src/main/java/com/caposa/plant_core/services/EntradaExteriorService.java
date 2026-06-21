package com.caposa.plant_core.services;

import com.caposa.plant_core.models.EntradaExterior;
import com.caposa.plant_core.repositories.EntradaExteriorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EntradaExteriorService {

    @Autowired
    private EntradaExteriorRepository entradaRepo;

    @Autowired
    private InventarioService inventarioService;

    @Transactional
    public EntradaExterior registrarEntrada(EntradaExterior nuevaEntrada) {
        if (nuevaEntrada.getCantidad() == null || nuevaEntrada.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a 0.");
        }
        EntradaExterior guardada = entradaRepo.save(nuevaEntrada);

        // Extraemos el ID del vínculo de inventario y la cantidad a sumar
        Long idInventario = guardada.getPlantaPresentacion().getId();
        Integer cantidadEntrante = guardada.getCantidad();

        // Actualizamos el stock
        inventarioService.agregarStock(idInventario, cantidadEntrante);

        return guardada;
    }
}