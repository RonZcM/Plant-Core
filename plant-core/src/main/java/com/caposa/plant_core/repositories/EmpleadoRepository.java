package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {
    // Spring Boot ya sabe hacer save(), findAll(), findById(), deleteById()
    // Si necesitas buscar por DUI, solo declaras el método así:
    Empleado findByDui(String dui);
}