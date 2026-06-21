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

    @ManyToOne
    @JoinColumn(name = "trabajador_id", nullable = false)
    private Empleado trabajador;

    @ManyToOne
    @JoinColumn(name = "planta_presentacion_destino_id", nullable = false)
    private PlantaPresentacion destino;

    @Column(name = "cantidad_destino")
    private Integer cantidadDestino;

    @OneToMany(mappedBy = "cambioPresentacion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<CambioPresentacionDetalle> detalles = new ArrayList<>();

    public CambioPresentacion() {
    }

    public CambioPresentacion(Long id, LocalDate fecha, Empleado trabajador, PlantaPresentacion destino, Integer cantidadDestino) {
        this.id = id;
        this.fecha = fecha;
        this.trabajador = trabajador;
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

    public Empleado getTrabajador() {
        return trabajador;
    }

    public void setTrabajador(Empleado trabajador) {
        this.trabajador = trabajador;
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