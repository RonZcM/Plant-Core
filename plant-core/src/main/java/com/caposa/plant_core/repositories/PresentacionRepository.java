package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.Presentacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PresentacionRepository extends JpaRepository<Presentacion, Long> {

    // Método para validar que no se repitan códigos (Ej: "PC#1")
    Optional<Presentacion> findByCodigo(String codigo);
}