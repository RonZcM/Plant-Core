package com.caposa.plant_core.models;

import jakarta.persistence.*;

@Entity
@Table(name = "cambio_presentacion_detalle")
public class CambioPresentacionDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cambio_presentacion_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private CambioPresentacion cambioPresentacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "planta_presentacion_origen_id", nullable = false)
    private PlantaPresentacion origen;

    @Column(name = "cantidad_origen", nullable = false)
    private Integer cantidadOrigen;

    public CambioPresentacionDetalle() {}

    public CambioPresentacionDetalle(CambioPresentacion cambioPresentacion, PlantaPresentacion origen, Integer cantidadOrigen) {
        this.cambioPresentacion = cambioPresentacion;
        this.origen = origen;
        this.cantidadOrigen = cantidadOrigen;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public CambioPresentacion getCambioPresentacion() { return cambioPresentacion; }
    public void setCambioPresentacion(CambioPresentacion cambioPresentacion) { this.cambioPresentacion = cambioPresentacion; }
    
    public PlantaPresentacion getOrigen() { return origen; }
    public void setOrigen(PlantaPresentacion origen) { this.origen = origen; }
    
    public Integer getCantidadOrigen() { return cantidadOrigen; }
    public void setCantidadOrigen(Integer cantidadOrigen) { this.cantidadOrigen = cantidadOrigen; }
}
