package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.Descargo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DescargoRepository extends JpaRepository<Descargo, Long> {
}