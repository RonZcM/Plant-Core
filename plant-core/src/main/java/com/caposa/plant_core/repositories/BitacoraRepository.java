package com.caposa.plant_core.repositories;

import com.caposa.plant_core.models.Bitacora;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BitacoraRepository extends JpaRepository<Bitacora, String> {

    // Para que el gerente pueda filtrar la bitácora por un año específico (Ej: 2026)
    List<Bitacora> findByAnioOrderByFechaDesc(String anio);

    // Para filtrar por mes exacto (rango de fechas del 1 al 30/31)
    List<Bitacora> findByFechaBetweenOrderByFechaDesc(LocalDate inicio, LocalDate fin);
}