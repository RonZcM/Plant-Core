import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Download, Upload, X, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idActual, setIdActual] = useState(null);
  
  const [formulario, setFormulario] = useState({
    nombre: '', apellido: '', dui: '', numero: '', fechaContratacion: '', createdBy: 'Admin'
  });

  // Estados para importación Excel
  const [modalImportar, setModalImportar] = useState(false);
  const [archivoImportar, setArchivoImportar] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      const res = await api.get('/empleados');
      setEmpleados(res.data);
    } catch (error) { console.error("Error cargando empleados", error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modoEdicion) {
        await api.put(`/empleados/${idActual}`, formulario);
      } else {
        await api.post('/empleados', formulario);
      }
      cancelarEdicion();
      cargarEmpleados();
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error("Error al guardar empleado.");
      }
    }
  };

  const editar = (emp) => {
    setModoEdicion(true);
    setIdActual(emp.id);
    setFormulario({
      nombre: emp.nombre,
      apellido: emp.apellido,
      dui: emp.dui,
      numero: emp.numero || '',
      fechaContratacion: emp.fechaContratacion || '',
      createdBy: emp.createdBy || 'Admin'
    });
  };

  const eliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este registro?")) {
      try {
        await api.delete(`/empleados/${id}`);
        toast.success("Empleado eliminado con éxito.");
        cargarEmpleados();
      } catch (error) { toast.error(error.response?.data || "Error al eliminar. Posiblemente tenga operaciones asignadas."); }
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setIdActual(null);
    setFormulario({ nombre: '', apellido: '', dui: '', numero: '', fechaContratacion: '', createdBy: 'Admin' });
  };

  const exportarExcel = async () => {
    try {
      const response = await api.get('/empleados/exportar', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'empleados.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Listado de personal exportado con éxito.");
    } catch (error) {
      console.error("Error exportando a Excel", error);
      toast.error("No se pudo exportar el listado de personal a Excel.");
    }
  };

  const abrirModalImportar = () => {
    setArchivoImportar(null);
    setResultadoImportacion(null);
    setImportando(false);
    setModalImportar(true);
  };

  const handleImportarExcel = async () => {
    if (!archivoImportar) return toast.error("Selecciona un archivo .xlsx");
    setImportando(true);
    try {
      const formData = new FormData();
      formData.append('file', archivoImportar);
      const res = await api.post('/empleados/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResultadoImportacion(res.data);
      if (res.data.filasImportadas > 0) {
        toast.success(`${res.data.filasImportadas} empleado(s) importado(s) con éxito.`);
        cargarEmpleados();
      }
    } catch (error) {
      toast.error(error.response?.data || "Error al importar el archivo.");
    } finally {
      setImportando(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.xlsx')) {
      setArchivoImportar(file);
      setResultadoImportacion(null);
    } else {
      toast.error('Solo se permiten archivos .xlsx');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoImportar(file);
      setResultadoImportacion(null);
    }
  };

  const filtrados = empleados.filter(e => 
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) || 
    e.dui.includes(busqueda)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Gestión de Personal</h2>
          <p className="text-sm text-gray-500 mt-1">Administración de la planilla de trabajadores de CAPOSA.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={abrirModalImportar} 
            className="bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center transform hover:-translate-y-0.5"
          >
            <Upload className="w-5 h-5 mr-2" />
            Importar
          </button>
          <button 
            onClick={exportarExcel} 
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center transform hover:-translate-y-0.5"
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{modoEdicion ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
              <input required type="text" value={formulario.nombre} onChange={e => setFormulario({...formulario, nombre: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
              <input required type="text" value={formulario.apellido} onChange={e => setFormulario({...formulario, apellido: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DUI</label>
              <input required type="text" value={formulario.dui} onChange={e => setFormulario({...formulario, dui: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500" placeholder="00000000-0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="text" value={formulario.numero} onChange={e => setFormulario({...formulario, numero: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500" placeholder="Ej: 7000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Contratación</label>
              <input type="date" value={formulario.fechaContratacion} onChange={e => setFormulario({...formulario, fechaContratacion: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500" />
            </div>
            
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-md transition-colors">
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </button>
              {modoEdicion && (
                <button type="button" onClick={cancelarEdicion} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-md transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <input 
              type="text" 
              placeholder="Buscar por nombre o DUI..." 
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nombre Completo</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">DUI</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.length > 0 ? filtrados.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{e.nombre} {e.apellido}</td>
                    <td className="px-6 py-3 font-mono text-sm">{e.dui}</td>
                    <td className="px-6 py-3 text-sm">{e.numero || 'N/A'}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => editar(e)} className="text-blue-600 hover:text-blue-900 mx-2 text-sm font-medium">Editar</button>
                      <button onClick={() => eliminar(e.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Borrar</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-8 text-gray-500">No se encontraron empleados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Importar Excel */}
      {modalImportar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Importar Personal</h3>
                  <p className="text-xs text-gray-500">Carga masiva desde archivo Excel</p>
                </div>
              </div>
              <button onClick={() => setModalImportar(false)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Zona de Drag & Drop */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                  ${dragOver ? 'border-blue-500 bg-blue-50 scale-[1.02]' : archivoImportar ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                onClick={() => document.getElementById('file-input-empleados').click()}
              >
                <input
                  id="file-input-empleados"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {archivoImportar ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                    <p className="font-semibold text-green-700">{archivoImportar.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(archivoImportar.size / 1024).toFixed(1)} KB · Click para cambiar</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="font-medium text-gray-600">Arrastra tu archivo .xlsx aquí</p>
                    <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
                  </div>
                )}
              </div>

              {/* Formato esperado */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Formato esperado del Excel:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-white">
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Nombre</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Apellido</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">DUI</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Teléfono</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Fecha Contratación</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">Juan</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">Pérez</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500 font-mono">12345678-9</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">7000-0000</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">2024-01-15</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resultados */}
              {resultadoImportacion && (
                <div className={`rounded-xl p-4 border ${resultadoImportacion.filasImportadas > 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {resultadoImportacion.filasImportadas > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className="font-bold text-sm text-gray-800">Resultado de la importación</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center mb-3">
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="text-lg font-black text-gray-800">{resultadoImportacion.totalFilas}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Total</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="text-lg font-black text-green-600">{resultadoImportacion.filasImportadas}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Importadas</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="text-lg font-black text-amber-600">{resultadoImportacion.filasOmitidas}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Omitidas</p>
                    </div>
                  </div>
                  {resultadoImportacion.errores?.length > 0 && (
                    <div className="max-h-32 overflow-y-auto bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs font-bold text-red-600 mb-1">Errores encontrados:</p>
                      {resultadoImportacion.errores.map((err, i) => (
                        <p key={i} className="text-xs text-red-500 py-0.5">• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setModalImportar(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                {resultadoImportacion ? 'Cerrar' : 'Cancelar'}
              </button>
              {!resultadoImportacion && (
                <button
                  onClick={handleImportarExcel}
                  disabled={!archivoImportar || importando}
                  className="flex-1 flex items-center justify-center px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {importando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Importar</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}