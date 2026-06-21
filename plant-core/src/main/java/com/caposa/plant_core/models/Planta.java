package com.caposa.plant_core.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "plantas")
public class Planta extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20)
    private String codigo;

    @Column(length = 100)
    private String nombre;

    @Column(length = 150)
    private String nombreCientifico;

    @Column(length = 255)
    private String imagen; // Ruta de la foto mapeada en WebConfig

    public Planta() {
    }

    public Planta(Long id, String codigo, String nombre, String nombreCientifico, String imagen, LocalDateTime crbyat, LocalDateTime upbyat) {
        this.id = id;
        this.codigo = codigo;
        this.nombre = nombre;
        this.nombreCientifico = nombreCientifico;
        this.imagen = imagen;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getNombreCientifico() {
        return nombreCientifico;
    }

    public void setNombreCientifico(String nombreCientifico) {
        this.nombreCientifico = nombreCientifico;
    }

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }
    
}