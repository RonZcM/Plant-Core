package com.caposa.plant_core.models.dto;


import java.time.LocalDate;
import java.time.LocalDateTime;

public class MovimientoDTO {
    private String idOperacion; // Ej: "PROD-1", "ENT-5"
    private String tipo; // "Producción", "Trasplante", "Descargo", "Entrada Exterior"
    private LocalDate fecha;
    private String empleado;
    private String detalle;
    private Integer cantidad;
    private LocalDateTime fechaRegistro; // Para ordenar cronológicamente

    // Constructor vacío
    public MovimientoDTO() {}

    // Getters y Setters
    public String getIdOperacion() { return idOperacion; }
    public void setIdOperacion(String idOperacion) { this.idOperacion = idOperacion; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public String getEmpleado() { return empleado; }
    public void setEmpleado(String empleado) { this.empleado = empleado; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}