package com.caposa.plant_core.models.dto;

import java.util.ArrayList;
import java.util.List;

public class ImportResultDTO {
    private int totalFilas;
    private int filasImportadas;
    private int filasOmitidas;
    private List<String> errores = new ArrayList<>();

    public ImportResultDTO() {}

    public int getTotalFilas() { return totalFilas; }
    public void setTotalFilas(int totalFilas) { this.totalFilas = totalFilas; }

    public int getFilasImportadas() { return filasImportadas; }
    public void setFilasImportadas(int filasImportadas) { this.filasImportadas = filasImportadas; }

    public int getFilasOmitidas() { return filasOmitidas; }
    public void setFilasOmitidas(int filasOmitidas) { this.filasOmitidas = filasOmitidas; }

    public List<String> getErrores() { return errores; }
    public void setErrores(List<String> errores) { this.errores = errores; }

    public void agregarError(String error) {
        this.errores.add(error);
    }

    public void incrementarImportadas() {
        this.filasImportadas++;
    }

    public void incrementarOmitidas() {
        this.filasOmitidas++;
    }
}
