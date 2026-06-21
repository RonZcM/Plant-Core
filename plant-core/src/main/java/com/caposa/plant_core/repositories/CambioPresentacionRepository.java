package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.CambioPresentacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CambioPresentacionRepository extends JpaRepository<CambioPresentacion, Long> {
}