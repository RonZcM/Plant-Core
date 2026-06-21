package com.caposa.plant_core.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cambio_presentacion")
public class CambioPresentacion extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fecha;

    @ManyToMany
    @JoinTable(
        name = "cambio_presentacion_trabajadores",
        joinColumns = @JoinColumn(name = "cambio_presentacion_id"),
        inverseJoinColumns = @JoinColumn(name = "empleado_id")
    )
    private java.util.List<Empleado> trabajadores = new java.util.ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "planta_presentacion_destino_id", nullable = false)
    private PlantaPresentacion destino;

    @Column(name = "cantidad_destino")
    private Integer cantidadDestino;

    @OneToMany(mappedBy = "cambioPresentacion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<CambioPresentacionDetalle> detalles = new ArrayList<>();

    public CambioPresentacion() {
    }

    public CambioPresentacion(Long id, LocalDate fecha, java.util.List<Empleado> trabajadores, PlantaPresentacion destino, Integer cantidadDestino) {
        this.id = id;
        this.fecha = fecha;
        this.trabajadores = trabajadores;
        this.destino = destino;
        this.cantidadDestino = cantidadDestino;
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

    public PlantaPresentacion getDestino() {
        return destino;
    }

    public void setDestino(PlantaPresentacion destino) {
        this.destino = destino;
    }

    public Integer getCantidadDestino() {
        return cantidadDestino;
    }

    public void setCantidadDestino(Integer cantidadDestino) {
        this.cantidadDestino = cantidadDestino;
    }

    public List<CambioPresentacionDetalle> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<CambioPresentacionDetalle> detalles) {
        this.detalles = detalles;
    }

    public void addDetalle(CambioPresentacionDetalle detalle) {
        detalles.add(detalle);
        detalle.setCambioPresentacion(this);
    }
    
    public void removeDetalle(CambioPresentacionDetalle detalle) {
        detalles.remove(detalle);
        detalle.setCambioPresentacion(null);
    }
}