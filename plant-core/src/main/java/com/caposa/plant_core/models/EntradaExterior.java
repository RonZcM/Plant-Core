package com.caposa.plant_core.models;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "entrada_exterior")
public class EntradaExterior extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @ManyToMany
    @JoinTable(
        name = "entrada_exterior_trabajadores",
        joinColumns = @JoinColumn(name = "entrada_exterior_id"),
        inverseJoinColumns = @JoinColumn(name = "empleado_id")
    )
    private java.util.List<Empleado> trabajadores = new java.util.ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "planta_presentacion_id", nullable = false)
    private PlantaPresentacion plantaPresentacion;

    @Column(nullable = false, length = 255)
    private String tipo; // "compra" o "devolucion"

    @Column(nullable = false)
    private Integer cantidad;

    @Column(length = 255)
    private String detalle; // Ej: "compra de plantas del vivero de soya"

    @Column(name = "total_precio")
    private Double totalPrecio; // Nullable si es devolución

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public java.util.List<Empleado> getTrabajadores() { return trabajadores; }
    public void setTrabajadores(java.util.List<Empleado> trabajadores) { this.trabajadores = trabajadores; }
    public PlantaPresentacion getPlantaPresentacion() { return plantaPresentacion; }
    public void setPlantaPresentacion(PlantaPresentacion plantaPresentacion) { this.plantaPresentacion = plantaPresentacion; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public Double getTotalPrecio() { return totalPrecio; }
    public void setTotalPrecio(Double totalPrecio) { this.totalPrecio = totalPrecio; }
}