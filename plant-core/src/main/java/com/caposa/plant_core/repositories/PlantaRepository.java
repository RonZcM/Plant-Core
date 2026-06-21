package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.Planta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlantaRepository extends JpaRepository<Planta, Long> {

    // Nuevo método para buscar si un código ya existe
    Optional<Planta> findByCodigo(String codigo);
}