package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.Produccion;
import com.caposa.plant_core.models.PlantaPresentacion;
import com.caposa.plant_core.repositories.PlantaPresentacionRepository;
import com.caposa.plant_core.repositories.ProduccionRepository;
import com.caposa.plant_core.services.ProduccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produccion")
@CrossOrigin(origins = "*") // Permite peticiones desde React (localhost:3000 o Vite)
public class ProduccionController {

    @Autowired
    private ProduccionService produccionService;

    @Autowired
    private ProduccionRepository produccionRepo;

    @Autowired
    private PlantaPresentacionRepository ppRepo;

    // GET: http://localhost:8080/api/produccion
    @GetMapping
    public List<Produccion> obtenerTodas() {
        return produccionRepo.findAll();
    }

    // POST: http://localhost:8080/api/produccion
    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Produccion produccion) {
        try {
            // Usamos el servicio porque tiene la transacción que actualiza el inventario
            Produccion nueva = produccionService.registrarProduccion(produccion);
            return ResponseEntity.ok(nueva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar producción: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        return produccionRepo.findById(id)
            .map(c -> ResponseEntity.ok(c))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            Produccion prod = produccionRepo.findById(id).orElse(null);
            if (prod == null) return ResponseEntity.notFound().build();
            // Revertir inventario: restar la cantidad que se sumó
            PlantaPresentacion pp = prod.getPlantaPresentacion();
            pp.setStock(pp.getStock() - prod.getCantidad());
            ppRepo.save(pp);
            produccionRepo.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al eliminar: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Produccion prodActualizada) {
        try {
            Produccion prod = produccionRepo.findById(id).orElse(null);
            if (prod == null) return ResponseEntity.notFound().build();
            
            // 1. Validar y Revertir
            PlantaPresentacion ppAntigua = prod.getPlantaPresentacion();
            Integer stockRevertido = ppAntigua.getStock() - prod.getCantidad();
            if (stockRevertido < 0) {
                return ResponseEntity.badRequest().body("No se puede editar: el stock del lote original quedaría negativo.");
            }
            
            // 2. Obtener nueva planta
            Long nuevaPlantaId = (prodActualizada.getPlantaPresentacion() != null) ? prodActualizada.getPlantaPresentacion().getId() : ppAntigua.getId();
            PlantaPresentacion ppNueva = ppRepo.findById(nuevaPlantaId).orElse(null);
            if (ppNueva == null) return ResponseEntity.badRequest().body("Lote destino no encontrado.");
            
            Integer nuevaCantidad = prodActualizada.getCantidad() != null ? prodActualizada.getCantidad() : prod.getCantidad();
            
            // 3. Aplicar
            if (ppAntigua.getId().equals(ppNueva.getId())) {
                ppAntigua.setStock(stockRevertido + nuevaCantidad);
                ppRepo.save(ppAntigua);
                prod.setPlantaPresentacion(ppAntigua);
            } else {
                ppAntigua.setStock(stockRevertido);
                ppNueva.setStock(ppNueva.getStock() + nuevaCantidad);
                ppRepo.save(ppAntigua);
                ppRepo.save(ppNueva);
                prod.setPlantaPresentacion(ppNueva);
            }
            
            // 4. Actualizar resto de campos
            if (prodActualizada.getFecha() != null) prod.setFecha(prodActualizada.getFecha());
            prod.setCantidad(nuevaCantidad);
            if (prodActualizada.getTrabajadores() != null) prod.setTrabajadores(prodActualizada.getTrabajadores());
            if (prodActualizada.getOrigenes() != null) prod.setOrigenes(prodActualizada.getOrigenes());
            if (prodActualizada.getSiembraTiempoHoras() != null) prod.setSiembraTiempoHoras(prodActualizada.getSiembraTiempoHoras());
            
            produccionRepo.save(prod);
            return ResponseEntity.ok(prod);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al editar: " + e.getMessage());
        }
    }
}