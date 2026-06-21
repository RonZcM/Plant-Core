package com.caposa.plant_core.models;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "produccion")
public class Produccion extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @ManyToOne
    @JoinColumn(name = "trabajador_id", nullable = false)
    private Empleado trabajador;

    @ManyToOne
    @JoinColumn(name = "planta_presentacion_id", nullable = false)
    private PlantaPresentacion plantaPresentacion;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "produccion_origen",
        joinColumns = @JoinColumn(name = "produccion_id"),
        inverseJoinColumns = @JoinColumn(name = "origen_id")
    )
    private java.util.Set<Origen> origenes;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "siembra_tiempo_horas")
    private Double siembraTiempoHoras; // Double por si ponen 1.5 horas

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public Empleado getTrabajador() { return trabajador; }
    public void setTrabajador(Empleado trabajador) { this.trabajador = trabajador; }
    public PlantaPresentacion getPlantaPresentacion() { return plantaPresentacion; }
    public void setPlantaPresentacion(PlantaPresentacion plantaPresentacion) { this.plantaPresentacion = plantaPresentacion; }
    public java.util.Set<Origen> getOrigenes() { return origenes; }
    public void setOrigenes(java.util.Set<Origen> origenes) { this.origenes = origenes; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public Double getSiembraTiempoHoras() { return siembraTiempoHoras; }
    public void setSiembraTiempoHoras(Double siembraTiempoHoras) { this.siembraTiempoHoras = siembraTiempoHoras; }
}