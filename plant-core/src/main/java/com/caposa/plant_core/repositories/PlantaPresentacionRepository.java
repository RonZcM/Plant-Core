package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.PlantaPresentacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PlantaPresentacionRepository extends JpaRepository<PlantaPresentacion, Long> {

    // Método mágico de Spring: Busca un registro que tenga esta Planta ID y esta Presentación ID
    Optional<PlantaPresentacion> findByPlantaIdAndPresentacionId(Long plantaId, Long presentacionId);
}