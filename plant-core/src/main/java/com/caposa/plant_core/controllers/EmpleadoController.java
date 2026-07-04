package com.caposa.plant_core.controllers;

import com.caposa.plant_core.models.Empleado;
import com.caposa.plant_core.repositories.EmpleadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;

@RestController
@RequestMapping("/api/empleados")
@CrossOrigin(origins = "*")
public class EmpleadoController {

    @Autowired
    private EmpleadoRepository empleadoRepo;

    @Autowired
    private com.caposa.plant_core.services.ExcelExportService excelExportService;

    @GetMapping
    public List<Empleado> obtenerTodos() {
        return empleadoRepo.findAll();
    }

    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportarExcel() {
        try {
            byte[] excelContent = excelExportService.exportarEmpleados();

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "empleados.xlsx");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(excelContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (java.io.IOException e) {
            return new ResponseEntity<>(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Empleado empleado) {
        try {
            if (empleadoRepo.findByDui(empleado.getDui()).isPresent()) {
                return ResponseEntity.badRequest().body("El DUI " + empleado.getDui() + " ya está registrado.");
            }
            return ResponseEntity.ok(empleadoRepo.save(empleado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar empleado: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Empleado actualizado) {
        try {
            Optional<Empleado> existente = empleadoRepo.findByDui(actualizado.getDui());
            if (existente.isPresent() && !existente.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("El DUI " + actualizado.getDui() + " ya está en uso por otro empleado.");
            }

            return empleadoRepo.findById(id).map(emp -> {
                emp.setNombre(actualizado.getNombre());
                emp.setApellido(actualizado.getApellido());
                emp.setDui(actualizado.getDui());
                emp.setNumero(actualizado.getNumero());
                emp.setFechaContratacion(actualizado.getFechaContratacion());
                return ResponseEntity.ok(empleadoRepo.save(emp));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return empleadoRepo.findById(id).map(emp -> {
            try {
                empleadoRepo.delete(emp);
                return ResponseEntity.ok().build();
            } catch (DataIntegrityViolationException e) {
                return ResponseEntity.badRequest().body("No se puede eliminar este empleado porque ya está asociado a operaciones históricas.");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @Autowired
    private com.caposa.plant_core.services.ExcelImportService excelImportService;

    @PostMapping("/importar")
    public ResponseEntity<?> importarExcel(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("El archivo está vacío.");
            }
            String filename = file.getOriginalFilename();
            if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
                return ResponseEntity.badRequest().body("Solo se permiten archivos .xlsx");
            }
            com.caposa.plant_core.models.dto.ImportResultDTO result = excelImportService.importarEmpleados(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al importar: " + e.getMessage());
        }
    }
}