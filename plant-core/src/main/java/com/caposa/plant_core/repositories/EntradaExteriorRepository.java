package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.EntradaExterior;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EntradaExteriorRepository extends JpaRepository<EntradaExterior, Long> {
}