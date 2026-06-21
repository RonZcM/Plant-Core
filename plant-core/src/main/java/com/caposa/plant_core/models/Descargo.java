package com.caposa.plant_core.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "descargo")
public class Descargo extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fecha;

    @ManyToMany
    @JoinTable(
        name = "descargo_trabajadores",
        joinColumns = @JoinColumn(name = "descargo_id"),
        inverseJoinColumns = @JoinColumn(name = "empleado_id")
    )
    private java.util.List<Empleado> trabajadores = new java.util.ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "planta_presentacion_id", nullable = false)
    private PlantaPresentacion plantaPresentacion;

    private Integer cantidad;

    @Column(name = "motivo_descargo", length = 255)
    private String motivoDescargo; // Ej: "Se las comió el zompopo"


    public Descargo() {
    }

    public Descargo(Long id, LocalDate fecha, java.util.List<Empleado> trabajadores, PlantaPresentacion plantaPresentacion, Integer cantidad, String motivoDescargo, LocalDateTime crbyat, LocalDateTime upbyat) {
        this.id = id;
        this.fecha = fecha;
        this.trabajadores = trabajadores;
        this.plantaPresentacion = plantaPresentacion;
        this.cantidad = cantidad;
        this.motivoDescargo = motivoDescargo;
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

    public java.util.List<Empleado> getTrabajadores() {
        return trabajadores;
    }

    public void setTrabajadores(java.util.List<Empleado> trabajadores) {
        this.trabajadores = trabajadores;
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

    public String getMotivoDescargo() {
        return motivoDescargo;
    }

    public void setMotivoDescargo(String motivoDescargo) {
        this.motivoDescargo = motivoDescargo;
    }

}