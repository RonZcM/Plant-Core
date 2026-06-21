package com.caposa.plant_core.models.dto;

import java.time.LocalDate;
import java.util.List;

public class CampoRequest {
    private LocalDate fecha;
    private String tipo;
    private Integer cantidad;
    private Long plantaPresentacionId;
    private List<Long> trabajadorIds;
    private List<Long> lugarIds;

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public Long getPlantaPresentacionId() { return plantaPresentacionId; }
    public void setPlantaPresentacionId(Long plantaPresentacionId) { this.plantaPresentacionId = plantaPresentacionId; }
    public List<Long> getTrabajadorIds() { return trabajadorIds; }
    public void setTrabajadorIds(List<Long> trabajadorIds) { this.trabajadorIds = trabajadorIds; }
    public List<Long> getLugarIds() { return lugarIds; }
    public void setLugarIds(List<Long> lugarIds) { this.lugarIds = lugarIds; }
}
