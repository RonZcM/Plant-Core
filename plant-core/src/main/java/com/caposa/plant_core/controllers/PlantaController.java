package com.caposa.plant_core.controllers;

import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.File;

import com.caposa.plant_core.models.Planta;
import com.caposa.plant_core.repositories.PlantaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/plantas")
@CrossOrigin(origins = "*")
public class PlantaController {

    @Autowired
    private PlantaRepository plantaRepo;

    @GetMapping
    public List<Planta> obtenerTodas() {
        return plantaRepo.findAll();
    }

    // CREAR (POST)
    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Planta planta) {
        try {
            // Validación de código duplicado
            if (plantaRepo.findByCodigo(planta.getCodigo()).isPresent()) {
                return ResponseEntity.badRequest().body("El código '" + planta.getCodigo() + "' ya está registrado en otra planta.");
            }

            Planta nueva = plantaRepo.save(planta);
            return ResponseEntity.ok(nueva);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar planta: " + e.getMessage());
        }
    }

    // EDITAR (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Planta plantaActualizada, @RequestParam(required = false, defaultValue = "false") boolean removerImagen) {
        try {
            // Validación de código duplicado (asegurándonos de que no sea la misma planta que estamos editando)
            Optional<Planta> existente = plantaRepo.findByCodigo(plantaActualizada.getCodigo());
            if (existente.isPresent() && !existente.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("El código '" + plantaActualizada.getCodigo() + "' ya está en uso por otra planta.");
            }

            return plantaRepo.findById(id).map(planta -> {
                planta.setCodigo(plantaActualizada.getCodigo());
                planta.setNombre(plantaActualizada.getNombre());
                planta.setNombreCientifico(plantaActualizada.getNombreCientifico());

                if (removerImagen) {
                    if (planta.getImagen() != null) {
                        try {
                            String nombreArchivoViejo = planta.getImagen().replace("/fotos/", "");
                            Path rutaVieja = Paths.get("../recursos/fotos/" + nombreArchivoViejo);
                            Files.deleteIfExists(rutaVieja);
                        } catch (Exception e) {
                            System.err.println("Error al borrar foto: " + e.getMessage());
                        }
                    }
                    planta.setImagen(null);
                }

                return ResponseEntity.ok(plantaRepo.save(planta));
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al actualizar planta: " + e.getMessage());
        }
    }

    // ELIMINAR (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return plantaRepo.findById(id).map(planta -> {
            // Antes de borrar la planta de la BD, borramos su foto del disco duro
            if (planta.getImagen() != null) {
                try {
                    String nombreArchivo = planta.getImagen().replace("/fotos/", "");
                    Path rutaFoto = Paths.get("../recursos/fotos/" + nombreArchivo);
                    Files.deleteIfExists(rutaFoto);
                } catch (Exception e) {
                    System.err.println("Error al borrar foto al eliminar planta: " + e.getMessage());
                }
            }

            plantaRepo.delete(planta);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // SUBIR IMAGEN
    @PostMapping("/{id}/imagen")
    public ResponseEntity<?> subirImagen(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            Planta planta = plantaRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Planta no encontrada"));

            File directorio = new File("../recursos/fotos");
            if (!directorio.exists()) {
                directorio.mkdirs();
            }

            // 1. Si la planta ya tiene una imagen, la borramos del disco duro
            if (planta.getImagen() != null) {
                // Extraemos solo el nombre del archivo de la ruta "/fotos/nombre.ext"
                String nombreArchivoViejo = planta.getImagen().replace("/fotos/", "");
                Path rutaVieja = Paths.get("../recursos/fotos/" + nombreArchivoViejo);
                Files.deleteIfExists(rutaVieja);
            }

            // 2. Extraer la extensión original del archivo (ej. ".png", ".jpg")
            String nombreOriginal = file.getOriginalFilename();
            String extension = "";
            if (nombreOriginal != null && nombreOriginal.contains(".")) {
                extension = nombreOriginal.substring(nombreOriginal.lastIndexOf("."));
            }

            // 3. Renombrar el archivo usando el código de la planta
            String nombreNuevoArchivo = planta.getCodigo() + extension;
            Path rutaAbsoluta = Paths.get("../recursos/fotos/" + nombreNuevoArchivo);

            // 4. Guardar físicamente
            Files.write(rutaAbsoluta, file.getBytes());

            // 5. Actualizar la base de datos con la nueva ruta
            planta.setImagen("/fotos/" + nombreNuevoArchivo);
            return ResponseEntity.ok(plantaRepo.save(planta));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al subir imagen: " + e.getMessage());
        }
    }

}