package com.caposa.plant_core.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
    @JoinColumn(name = "planta_presentacion_origen_id", nullable = false)
    private PlantaPresentacion origen;

    @ManyToOne
    @JoinColumn(name = "planta_presentacion_destino_id", nullable = false)
    private PlantaPresentacion destino;

    private Integer cantidad;


    public CambioPresentacion() {
    }

    public CambioPresentacion(Long id, LocalDate fecha, Empleado trabajador, PlantaPresentacion origen, PlantaPresentacion destino, Integer cantidad, LocalDateTime crbyat, LocalDateTime upbyat) {
        this.id = id;
        this.fecha = fecha;
        this.trabajador = trabajador;
        this.origen = origen;
        this.destino = destino;
        this.cantidad = cantidad;
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

    public PlantaPresentacion getOrigen() {
        return origen;
    }

    public void setOrigen(PlantaPresentacion origen) {
        this.origen = origen;
    }

    public PlantaPresentacion getDestino() {
        return destino;
    }

    public void setDestino(PlantaPresentacion destino) {
        this.destino = destino;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

}