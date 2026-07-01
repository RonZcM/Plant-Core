package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.*;
import com.caposa.plant_core.models.dto.CampoRequest;
import com.caposa.plant_core.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campo")
@CrossOrigin(origins = "*")
public class CampoController {

    @Autowired private CampoRepository campoRepo;
    @Autowired private PlantaPresentacionRepository ppRepo;
    @Autowired private EmpleadoRepository empleadoRepo;
    @Autowired private OrigenRepository origenRepo;

    @GetMapping
    public List<Campo> getAll() {
        return campoRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CampoRequest req) {
        PlantaPresentacion pp = ppRepo.findById(req.getPlantaPresentacionId()).orElse(null);
        if (pp == null) {
            return ResponseEntity.badRequest().body("Vínculo de inventario no encontrado.");
        }

        if (req.getCantidad() == null || req.getCantidad() <= 0) {
            return ResponseEntity.badRequest().body("La cantidad debe ser mayor a 0.");
        }

        if ("Salida".equals(req.getTipo())) {
            if (pp.getStock() < req.getCantidad()) {
                return ResponseEntity.badRequest().body("No hay suficiente stock para sembrar a campo. Stock actual: " + pp.getStock());
            }
            pp.setStock(pp.getStock() - req.getCantidad());
        } else if ("Entrada".equals(req.getTipo())) {
            pp.setStock(pp.getStock() + req.getCantidad());
        } else {
            return ResponseEntity.badRequest().body("Tipo de operación inválido. Debe ser 'Salida' o 'Entrada'.");
        }

        ppRepo.save(pp);

        Campo campo = new Campo();
        campo.setFecha(req.getFecha());
        campo.setTipo(req.getTipo());
        campo.setCantidad(req.getCantidad());
        campo.setPlantaPresentacion(pp);
        
        if (req.getTrabajadorIds() != null && !req.getTrabajadorIds().isEmpty()) {
            campo.setTrabajadores(empleadoRepo.findAllById(req.getTrabajadorIds()));
        }
        
        if (req.getLugarIds() != null && !req.getLugarIds().isEmpty()) {
            campo.setLugares(origenRepo.findAllById(req.getLugarIds()));
        }

        Campo saved = campoRepo.save(campo);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        return campoRepo.findById(id)
            .map(c -> ResponseEntity.ok(c))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            Campo campo = campoRepo.findById(id).orElse(null);
            if (campo == null) return ResponseEntity.notFound().build();
            // Revertir inventario
            PlantaPresentacion pp = campo.getPlantaPresentacion();
            if ("Salida".equals(campo.getTipo())) {
                pp.setStock(pp.getStock() + campo.getCantidad()); // was subtracted
            } else {
                pp.setStock(pp.getStock() - campo.getCantidad()); // was added
            }
            ppRepo.save(pp);
            campoRepo.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar: " + e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody CampoRequest req) {
        try {
            Campo campo = campoRepo.findById(id).orElse(null);
            if (campo == null) return ResponseEntity.notFound().build();
            
            // 1. Revertir impacto de campo
            PlantaPresentacion ppAntigua = campo.getPlantaPresentacion();
            Integer stockRevertido = ppAntigua.getStock();
            if ("Salida".equals(campo.getTipo())) {
                stockRevertido += campo.getCantidad(); // Se había restado, lo devolvemos
            } else {
                stockRevertido -= campo.getCantidad(); // Se había sumado, lo quitamos
                if (stockRevertido < 0) {
                    return ResponseEntity.badRequest().body("No se puede revertir: el inventario quedaría en negativo.");
                }
            }
            
            // 2. Obtener nueva planta
            Long nuevaPlantaId = (req.getPlantaPresentacionId() != null) ? req.getPlantaPresentacionId() : ppAntigua.getId();
            PlantaPresentacion ppNueva = ppRepo.findById(nuevaPlantaId).orElse(null);
            if (ppNueva == null) return ResponseEntity.badRequest().body("Lote no encontrado.");
            
            Integer nuevaCantidad = req.getCantidad() != null ? req.getCantidad() : campo.getCantidad();
            String nuevoTipo = req.getTipo() != null ? req.getTipo() : campo.getTipo();
            
            // 3. Aplicar nuevo impacto
            if (ppAntigua.getId().equals(ppNueva.getId())) {
                Integer nuevoStock = stockRevertido;
                if ("Salida".equals(nuevoTipo)) {
                    nuevoStock -= nuevaCantidad;
                } else {
                    nuevoStock += nuevaCantidad;
                }
                if (nuevoStock < 0) return ResponseEntity.badRequest().body("El stock quedaría en negativo con este cambio.");
                ppAntigua.setStock(nuevoStock);
                ppRepo.save(ppAntigua);
                campo.setPlantaPresentacion(ppAntigua);
            } else {
                Integer stockParaNueva = ppNueva.getStock();
                if ("Salida".equals(nuevoTipo)) {
                    stockParaNueva -= nuevaCantidad;
                } else {
                    stockParaNueva += nuevaCantidad;
                }
                if (stockParaNueva < 0) return ResponseEntity.badRequest().body("El stock del nuevo lote quedaría en negativo.");
                
                ppAntigua.setStock(stockRevertido);
                ppNueva.setStock(stockParaNueva);
                ppRepo.save(ppAntigua);
                ppRepo.save(ppNueva);
                campo.setPlantaPresentacion(ppNueva);
            }
            
            // 4. Actualizar campos
            if (req.getFecha() != null) campo.setFecha(req.getFecha());
            campo.setCantidad(nuevaCantidad);
            campo.setTipo(nuevoTipo);
            
            if (req.getTrabajadorIds() != null && !req.getTrabajadorIds().isEmpty()) {
                campo.setTrabajadores(empleadoRepo.findAllById(req.getTrabajadorIds()));
            }
            if (req.getLugarIds() != null && !req.getLugarIds().isEmpty()) {
                campo.setLugares(origenRepo.findAllById(req.getLugarIds()));
            }
            
            campoRepo.save(campo);
            return ResponseEntity.ok(campo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al editar: " + e.getMessage());
        }
    }
}
