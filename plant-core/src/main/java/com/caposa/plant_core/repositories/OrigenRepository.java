package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.Origen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrigenRepository extends JpaRepository<Origen, Long> {
    Optional<Origen> findByCodigo(String codigo);
}