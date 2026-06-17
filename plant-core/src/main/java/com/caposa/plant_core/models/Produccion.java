package com.caposa.plant_core.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "produccion")
public class Produccion extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fecha;

    @ManyToOne
    @JoinColumn(name = "trabajador_id", nullable = false)
    private Empleado trabajador;

    @ManyToOne
    @JoinColumn(name = "planta_presentacion_id", nullable = false)
    private PlantaPresentacion plantaPresentacion;

    private Integer cantidad;

    @Column(name = "siembra_tiempo_horas")
    private Double siembraTiempoHoras;


    public Produccion() {
    }

    public Produccion(Long id, LocalDate fecha, Empleado trabajador, PlantaPresentacion plantaPresentacion, Integer cantidad, Double siembraTiempoHoras, LocalDateTime crbyat, LocalDateTime upbyat) {
        this.id = id;
        this.fecha = fecha;
        this.trabajador = trabajador;
        this.plantaPresentacion = plantaPresentacion;
        this.cantidad = cantidad;
        this.siembraTiempoHoras = siembraTiempoHoras;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Empleado getTrabajador() {
        return trabajador;
    }

    public void setTrabajador(Empleado trabajador) {
        this.trabajador = trabajador;
    }

    public PlantaPresentacion getPlantaPresentacion() {
        return plantaPresentacion;
    }

    public void setPlantaPresentacion(PlantaPresentacion plantaPresentacion) {
        this.plantaPresentacion = plantaPresentacion;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public Double getSiembraTiempoHoras() {
        return siembraTiempoHoras;
    }

    public void setSiembraTiempoHoras(Double siembraTiempoHoras) {
        this.siembraTiempoHoras = siembraTiempoHoras;
    }

}