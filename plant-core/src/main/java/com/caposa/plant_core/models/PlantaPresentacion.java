package com.caposa.plant_core.models;

import jakarta.persistence.*;

@Entity
@Table(name = "planta_presentacion")
public class PlantaPresentacion extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    @ManyToOne
    @JoinColumn(name = "presentacion_id", nullable = false)
    private Presentacion presentacion;

    @Column(unique = true, length = 20)
    private String codigo; // Ej: PQCA01001

    @Column(length = 255)
    private String detalle;

    @Column(length = 50)
    private String tamanio; // Ej: 8 pulgadas, 40 cm

    @Column(nullable = false)
    private Integer stock; // Antes se llamaba 'inventario'

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Planta getPlanta() {
        return planta;
    }

    public void setPlanta(Planta planta) {
        this.planta = planta;
    }

    public Presentacion getPresentacion() {
        return presentacion;
    }

    public void setPresentacion(Presentacion presentacion) {
        this.presentacion = presentacion;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public String getTamanio() {
        return tamanio;
    }

    public void setTamanio(String tamanio) {
        this.tamanio = tamanio;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }
}