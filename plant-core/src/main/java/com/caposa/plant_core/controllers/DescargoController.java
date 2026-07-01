package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.Descargo;
import com.caposa.plant_core.models.PlantaPresentacion;
import com.caposa.plant_core.repositories.DescargoRepository;
import com.caposa.plant_core.repositories.PlantaPresentacionRepository;
import com.caposa.plant_core.services.DescargoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/descargos")
@CrossOrigin(origins = "*")
public class DescargoController {

    @Autowired
    private DescargoService descargoService;

    @Autowired
    private DescargoRepository descargoRepo;

    @Autowired
    private PlantaPresentacionRepository ppRepo;

    @GetMapping
    public List<Descargo> obtenerTodos() {
        return descargoRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Descargo descargo) {
        try {
            Descargo nuevo = descargoService.registrarDescargo(descargo);
            return ResponseEntity.ok(nuevo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar descargo: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        return descargoRepo.findById(id)
            .map(c -> ResponseEntity.ok(c))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            Descargo descargo = descargoRepo.findById(id).orElse(null);
            if (descargo == null) return ResponseEntity.notFound().build();
            // Revertir inventario: sumar la cantidad que se restó
            PlantaPresentacion pp = descargo.getPlantaPresentacion();
            pp.setStock(pp.getStock() + descargo.getCantidad());
            ppRepo.save(pp);
            descargoRepo.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar: " + e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Descargo descargoActualizado) {
        try {
            Descargo descargo = descargoRepo.findById(id).orElse(null);
            if (descargo == null) return ResponseEntity.notFound().build();
            
            // 1. Revertir Descargo (Sumar inventario)
            PlantaPresentacion ppAntigua = descargo.getPlantaPresentacion();
            Integer stockRevertido = ppAntigua.getStock() + descargo.getCantidad();
            
            // 2. Obtener nueva planta
            Long nuevaPlantaId = (descargoActualizado.getPlantaPresentacion() != null) ? descargoActualizado.getPlantaPresentacion().getId() : ppAntigua.getId();
            PlantaPresentacion ppNueva = ppRepo.findById(nuevaPlantaId).orElse(null);
            if (ppNueva == null) return ResponseEntity.badRequest().body("Lote afectado no encontrado.");
            
            Integer nuevaCantidad = descargoActualizado.getCantidad() != null ? descargoActualizado.getCantidad() : descargo.getCantidad();
            
            // 3. Aplicar nuevo descargo (Restar inventario)
            if (ppAntigua.getId().equals(ppNueva.getId())) {
                Integer nuevoStock = stockRevertido - nuevaCantidad;
                if (nuevoStock < 0) return ResponseEntity.badRequest().body("No hay stock suficiente para el nuevo descargo.");
                ppAntigua.setStock(nuevoStock);
                ppRepo.save(ppAntigua);
                descargo.setPlantaPresentacion(ppAntigua);
            } else {
                if (ppNueva.getStock() - nuevaCantidad < 0) {
                    return ResponseEntity.badRequest().body("No hay stock suficiente en el nuevo lote para el descargo.");
                }
                ppAntigua.setStock(stockRevertido);
                ppNueva.setStock(ppNueva.getStock() - nuevaCantidad);
                ppRepo.save(ppAntigua);
                ppRepo.save(ppNueva);
                descargo.setPlantaPresentacion(ppNueva);
            }
            
            // 4. Actualizar resto de campos
            if (descargoActualizado.getFecha() != null) descargo.setFecha(descargoActualizado.getFecha());
            descargo.setCantidad(nuevaCantidad);
            if (descargoActualizado.getTrabajadores() != null) descargo.setTrabajadores(descargoActualizado.getTrabajadores());
            if (descargoActualizado.getMotivoDescargo() != null) descargo.setMotivoDescargo(descargoActualizado.getMotivoDescargo());
            
            descargoRepo.save(descargo);
            return ResponseEntity.ok(descargo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al editar: " + e.getMessage());
        }
    }
}