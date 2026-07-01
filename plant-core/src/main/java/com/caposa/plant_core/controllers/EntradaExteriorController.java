package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.EntradaExterior;
import com.caposa.plant_core.models.PlantaPresentacion;
import com.caposa.plant_core.repositories.EntradaExteriorRepository;
import com.caposa.plant_core.repositories.PlantaPresentacionRepository;
import com.caposa.plant_core.services.EntradaExteriorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entradas-exteriores")
@CrossOrigin(origins = "*")
public class EntradaExteriorController {

    @Autowired
    private EntradaExteriorService entradaService;

    @Autowired
    private EntradaExteriorRepository entradaRepo;

    @Autowired
    private PlantaPresentacionRepository ppRepo;

    @GetMapping
    public List<EntradaExterior> obtenerTodas() {
        return entradaRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody EntradaExterior entrada) {
        try {
            EntradaExterior nueva = entradaService.registrarEntrada(entrada);
            return ResponseEntity.ok(nueva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar entrada: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        return entradaRepo.findById(id)
            .map(c -> ResponseEntity.ok(c))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            EntradaExterior entrada = entradaRepo.findById(id).orElse(null);
            if (entrada == null) return ResponseEntity.notFound().build();
            // Revertir inventario: restar la cantidad que se sumó
            PlantaPresentacion pp = entrada.getPlantaPresentacion();
            pp.setStock(pp.getStock() - entrada.getCantidad());
            ppRepo.save(pp);
            entradaRepo.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar: " + e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody EntradaExterior entradaActualizada) {
        try {
            EntradaExterior entrada = entradaRepo.findById(id).orElse(null);
            if (entrada == null) return ResponseEntity.notFound().build();
            
            // 1. Revertir Entrada (Restar inventario)
            PlantaPresentacion ppAntigua = entrada.getPlantaPresentacion();
            Integer stockRevertido = ppAntigua.getStock() - entrada.getCantidad();
            if (stockRevertido < 0) {
                return ResponseEntity.badRequest().body("No se puede editar: el stock del lote original quedaría negativo.");
            }
            
            // 2. Obtener nueva planta
            Long nuevaPlantaId = (entradaActualizada.getPlantaPresentacion() != null) ? entradaActualizada.getPlantaPresentacion().getId() : ppAntigua.getId();
            PlantaPresentacion ppNueva = ppRepo.findById(nuevaPlantaId).orElse(null);
            if (ppNueva == null) return ResponseEntity.badRequest().body("Lote destino no encontrado.");
            
            Integer nuevaCantidad = entradaActualizada.getCantidad() != null ? entradaActualizada.getCantidad() : entrada.getCantidad();
            
            // 3. Aplicar nueva entrada (Sumar inventario)
            if (ppAntigua.getId().equals(ppNueva.getId())) {
                ppAntigua.setStock(stockRevertido + nuevaCantidad);
                ppRepo.save(ppAntigua);
                entrada.setPlantaPresentacion(ppAntigua);
            } else {
                ppAntigua.setStock(stockRevertido);
                ppNueva.setStock(ppNueva.getStock() + nuevaCantidad);
                ppRepo.save(ppAntigua);
                ppRepo.save(ppNueva);
                entrada.setPlantaPresentacion(ppNueva);
            }
            
            // 4. Actualizar resto de campos
            if (entradaActualizada.getFecha() != null) entrada.setFecha(entradaActualizada.getFecha());
            entrada.setCantidad(nuevaCantidad);
            if (entradaActualizada.getTipo() != null) entrada.setTipo(entradaActualizada.getTipo());
            if (entradaActualizada.getTrabajadores() != null) entrada.setTrabajadores(entradaActualizada.getTrabajadores());
            if (entradaActualizada.getDetalle() != null) entrada.setDetalle(entradaActualizada.getDetalle());
            entrada.setTotalPrecio(entradaActualizada.getTotalPrecio()); // Puede ser null
            
            entradaRepo.save(entrada);
            return ResponseEntity.ok(entrada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al editar: " + e.getMessage());
        }
    }
}