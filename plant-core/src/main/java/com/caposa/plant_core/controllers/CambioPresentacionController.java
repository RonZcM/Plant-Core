package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.CambioPresentacion;
import com.caposa.plant_core.models.CambioPresentacionDetalle;
import com.caposa.plant_core.models.PlantaPresentacion;
import com.caposa.plant_core.repositories.CambioPresentacionRepository;
import com.caposa.plant_core.repositories.PlantaPresentacionRepository;
import com.caposa.plant_core.services.CambioPresentacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cambios-presentacion")
@CrossOrigin(origins = "*")
public class CambioPresentacionController {

    @Autowired
    private CambioPresentacionService cambioService;

    @Autowired
    private CambioPresentacionRepository cambioRepo;

    @Autowired
    private PlantaPresentacionRepository ppRepo;

    @GetMapping
    public List<CambioPresentacion> obtenerTodos() {
        return cambioRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody CambioPresentacion cambio) {
        try {
            CambioPresentacion nuevo = cambioService.registrarCambio(cambio);
            return ResponseEntity.ok(nuevo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar cambio de presentación: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        return cambioRepo.findById(id)
            .map(c -> ResponseEntity.ok(c))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            CambioPresentacion cambio = cambioRepo.findById(id).orElse(null);
            if (cambio == null) return ResponseEntity.notFound().build();
            // Revertir inventario: restar del destino, sumar a los orígenes
            PlantaPresentacion destino = cambio.getDestino();
            destino.setStock(destino.getStock() - cambio.getCantidadDestino());
            ppRepo.save(destino);
            for (CambioPresentacionDetalle det : cambio.getDetalles()) {
                PlantaPresentacion origen = det.getOrigen();
                origen.setStock(origen.getStock() + det.getCantidadOrigen());
                ppRepo.save(origen);
            }
            cambioRepo.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar: " + e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody CambioPresentacion cambioActualizado) {
        try {
            CambioPresentacion cambio = cambioRepo.findById(id).orElse(null);
            if (cambio == null) return ResponseEntity.notFound().build();
            
            // 1. Validar y Revertir Destino
            PlantaPresentacion destinoAntiguo = cambio.getDestino();
            Integer stockRevertidoDestino = destinoAntiguo.getStock() - cambio.getCantidadDestino();
            if (stockRevertidoDestino < 0) {
                return ResponseEntity.badRequest().body("No se puede editar: el stock del lote destino original quedaría negativo.");
            }
            
            // Revertir orígenes (devolverles su cantidad)
            for (CambioPresentacionDetalle det : cambio.getDetalles()) {
                PlantaPresentacion origen = det.getOrigen();
                // Check if origen is the same as destinoAntiguo to avoid overriding in memory
                if (origen.getId().equals(destinoAntiguo.getId())) {
                    origen = destinoAntiguo; 
                }
                origen.setStock(origen.getStock() + det.getCantidadOrigen());
                ppRepo.save(origen);
            }
            
            // 2. Obtener nuevo destino y orígenes
            Long nuevoDestinoId = (cambioActualizado.getDestino() != null) ? cambioActualizado.getDestino().getId() : destinoAntiguo.getId();
            PlantaPresentacion destinoNuevo = ppRepo.findById(nuevoDestinoId).orElse(null);
            if (destinoNuevo == null) return ResponseEntity.badRequest().body("Lote destino no encontrado.");
            
            Integer nuevaCantidadDestino = cambioActualizado.getCantidadDestino() != null ? cambioActualizado.getCantidadDestino() : cambio.getCantidadDestino();
            
            // Aplicar nuevo destino
            if (destinoAntiguo.getId().equals(destinoNuevo.getId())) {
                destinoAntiguo.setStock(stockRevertidoDestino + nuevaCantidadDestino);
                ppRepo.save(destinoAntiguo);
                cambio.setDestino(destinoAntiguo);
            } else {
                destinoAntiguo.setStock(stockRevertidoDestino);
                destinoNuevo.setStock(destinoNuevo.getStock() + nuevaCantidadDestino);
                ppRepo.save(destinoAntiguo);
                ppRepo.save(destinoNuevo);
                cambio.setDestino(destinoNuevo);
            }
            
            // Aplicar nuevos orígenes
            cambio.getDetalles().clear();
            if (cambioActualizado.getDetalles() != null && !cambioActualizado.getDetalles().isEmpty()) {
                for (CambioPresentacionDetalle detActualizado : cambioActualizado.getDetalles()) {
                    PlantaPresentacion origenNuevo = ppRepo.findById(detActualizado.getOrigen().getId()).orElse(null);
                    if (origenNuevo == null) continue;
                    
                    if (origenNuevo.getId().equals(destinoAntiguo.getId())) origenNuevo = destinoAntiguo;
                    if (origenNuevo.getId().equals(destinoNuevo.getId())) origenNuevo = destinoNuevo;
                    
                    if (origenNuevo.getStock() < detActualizado.getCantidadOrigen()) {
                        throw new RuntimeException("Stock insuficiente en el origen " + origenNuevo.getCodigo());
                    }
                    origenNuevo.setStock(origenNuevo.getStock() - detActualizado.getCantidadOrigen());
                    ppRepo.save(origenNuevo);
                    
                    CambioPresentacionDetalle nuevoDetalle = new CambioPresentacionDetalle();
                    nuevoDetalle.setOrigen(origenNuevo);
                    nuevoDetalle.setCantidadOrigen(detActualizado.getCantidadOrigen());
                    cambio.addDetalle(nuevoDetalle);
                }
            }
            
            // 4. Actualizar resto de campos
            if (cambioActualizado.getFecha() != null) cambio.setFecha(cambioActualizado.getFecha());
            cambio.setCantidadDestino(nuevaCantidadDestino);
            if (cambioActualizado.getTrabajadores() != null) cambio.setTrabajadores(cambioActualizado.getTrabajadores());
            
            cambioRepo.save(cambio);
            return ResponseEntity.ok(cambio);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al editar: " + e.getMessage());
        }
    }
}