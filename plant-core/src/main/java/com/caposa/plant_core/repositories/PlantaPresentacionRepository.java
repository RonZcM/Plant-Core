package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.PlantaPresentacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlantaPresentacionRepository extends JpaRepository<PlantaPresentacion, Long> {
    boolean existsByPlantaIdAndPresentacionId(Long plantaId, Long presentacionId);
    boolean existsByCodigo(String codigo);
    Optional<PlantaPresentacion> findByCodigo(String codigo);
}