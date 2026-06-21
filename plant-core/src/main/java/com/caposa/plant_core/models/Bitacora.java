package com.caposa.plant_core.models;

import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;
import java.time.LocalDate;

@Entity
@Immutable // Indica que es de solo lectura (Vista)
@Table(name = "vista_bitacora_ml")
public class Bitacora {

    // Usaremos un ID virtual combinando tipo_movimiento y movimiento_id en la consulta o asumiendo que la vista lo provee
    @Id
    @Column(name = "id_unico")
    private String idUnico;

    @Column(name = "movimiento_id")
    private Long movimientoId;

    @Column(name = "tipo_movimiento", length = 50)
    private String tipoMovimiento;

    private LocalDate fecha;

    @Column(length = 4)
    private String anio;

    // Relaciones para traer los datos completos y no solo los IDs
    @ManyToOne
    @JoinColumn(name = "trabajador_id")
    private Empleado trabajador;

    @ManyToOne
    @JoinColumn(name = "planta_presentacion_origen_id")
    private PlantaPresentacion origen;

    @ManyToOne
    @JoinColumn(name = "planta_presentacion_destino_id")
    private PlantaPresentacion destino;

    private Integer cantidad;

    @Column(length = 255)
    private String detalle;

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public PlantaPresentacion getDestino() {
        return destino;
    }

    public void setDestino(PlantaPresentacion destino) {
        this.destino = destino;
    }

    public PlantaPresentacion getOrigen() {
        return origen;
    }

    public void setOrigen(PlantaPresentacion origen) {
        this.origen = origen;
    }

    public Empleado getTrabajador() {
        return trabajador;
    }

    public void setTrabajador(Empleado trabajador) {
        this.trabajador = trabajador;
    }

    public String getAnio() {
        return anio;
    }

    public void setAnio(String anio) {
        this.anio = anio;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getTipoMovimiento() {
        return tipoMovimiento;
    }

    public void setTipoMovimiento(String tipoMovimiento) {
        this.tipoMovimiento = tipoMovimiento;
    }

    public Long getMovimientoId() {
        return movimientoId;
    }

    public void setMovimientoId(Long movimientoId) {
        this.movimientoId = movimientoId;
    }

    public String getIdUnico() {
        return idUnico;
    }

    public void setIdUnico(String idUnico) {
        this.idUnico = idUnico;
    }
}