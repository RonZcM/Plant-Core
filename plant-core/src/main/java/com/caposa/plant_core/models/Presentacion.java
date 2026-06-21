package com.caposa.plant_core.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "presentaciones")
public class Presentacion extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20)
    private String codigo;

    @Column(length = 50)
    private String nombre; // Ej: Maceta, Bolsa, Canasta

    private Integer cc; // Cantidad fija de sustrato

    private Integer requisicion;


    public Presentacion() {
    }

    public Presentacion(Long id, String codigo, String nombre, Integer cc, Integer requisicion, LocalDateTime crbyat, LocalDateTime upbyat) {
        this.id = id;
        this.codigo = codigo;
        this.nombre = nombre;
        this.cc = cc;
        this.requisicion = requisicion;
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

    public Integer getCc() {
        return cc;
    }

    public void setCc(Integer cc) {
        this.cc = cc;
    }

    public Integer getRequisicion() {
        return requisicion;
    }

    public void setRequisicion(Integer requisicion) {
        this.requisicion = requisicion;
    }


}