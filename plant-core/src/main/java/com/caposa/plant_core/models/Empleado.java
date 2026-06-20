package com.caposa.plant_core.models;

import jakarta.persistence.*;

@Entity
@Table(name = "empleados")
public class Empleado extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellido;

    @Column(unique = true, nullable = false, length = 10)
    private String dui; // Formato esperado: 00000000-0

    @Column(length = 20)
    private String numero; // Teléfono

    @Column(name = "fecha_contratacion")
    private String fechaContratacion;

    // Genera los Getters y Setters para id, nombre, apellido, dui, numero y fechaContratacion
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }
    public String getDui() { return dui; }
    public void setDui(String dui) { this.dui = dui; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getFechaContratacion() {
        return fechaContratacion;
    }

    public void setFechaContratacion(String fechaContratacion) {
        this.fechaContratacion = fechaContratacion;
    }
}