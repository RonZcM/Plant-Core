package com.caposa.plant_core.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "campo")
public class Campo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    // "Salida" (Sembrar a campo) o "Entrada" (Sacar de campo)
    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private Integer cantidad;

    @ManyToOne(optional = false)
    @JoinColumn(name = "planta_presentacion_id")
    private PlantaPresentacion plantaPresentacion;

    @ManyToMany
    @JoinTable(
        name = "campo_trabajadores",
        joinColumns = @JoinColumn(name = "campo_id"),
        inverseJoinColumns = @JoinColumn(name = "empleado_id")
    )
    private List<Empleado> trabajadores;

    @ManyToMany
    @JoinTable(
        name = "campo_lugares",
        joinColumns = @JoinColumn(name = "campo_id"),
        inverseJoinColumns = @JoinColumn(name = "origen_id")
    )
    private List<Origen> lugares;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public PlantaPresentacion getPlantaPresentacion() { return plantaPresentacion; }
    public void setPlantaPresentacion(PlantaPresentacion plantaPresentacion) { this.plantaPresentacion = plantaPresentacion; }
    public List<Empleado> getTrabajadores() { return trabajadores; }
    public void setTrabajadores(List<Empleado> trabajadores) { this.trabajadores = trabajadores; }
    public List<Origen> getLugares() { return lugares; }
    public void setLugares(List<Origen> lugares) { this.lugares = lugares; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
