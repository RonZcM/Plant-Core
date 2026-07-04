import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Eye, Pencil, Trash2, X, AlertTriangle, Loader2, Search, Filter, Download, RefreshCw, ClipboardList, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Estados para modales de acciones
  const [modalDetalle, setModalDetalle] = useState(null);
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Estados para importación Excel
  const [modalImportar, setModalImportar] = useState(false);
  const [archivoImportar, setArchivoImportar] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    cargarBitacora();
  }, []);

  const cargarBitacora = async () => {
    try {
      setCargando(true);
      const res = await api.get('/bitacora', { params: { startDate, endDate } });
      setHistorial(res.data);
      setCargando(false);
    } catch (error) {
      console.error("Error cargando la bitácora", error);
      setCargando(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const response = await api.get('/bitacora/exportar', {
        responseType: 'blob',
        params: { startDate, endDate }
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bitacora.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exportando a Excel", error);
      toast.error("No se pudo exportar la bitácora a Excel.");
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
      const res = await api.post('/bitacora/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResultadoImportacion(res.data);
      if (res.data.filasImportadas > 0) {
        toast.success(`${res.data.filasImportadas} operación(es) importada(s) con éxito.`);
        cargarBitacora();
      }
    } catch (error) {
      toast.error(error.response?.data || "Error al importar el archivo.");
    } finally {
      setImportando(false);
    }
  };

  const handleDropBitacora = (e) => {
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

  const handleFileSelectBitacora = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoImportar(file);
      setResultadoImportacion(null);
    }
  };

  const getTipoConfig = (tipo) => {
    switch (tipo) {
      case 'Producción': return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', border: 'border-l-emerald-500', icon: '🌱', cantColor: 'text-emerald-600' };
      case 'Cambio Presentación': return { bg: 'bg-sky-100 text-sky-800 border-sky-200', border: 'border-l-sky-500', icon: '🔄', cantColor: 'text-sky-600' };
      case 'Descargo': return { bg: 'bg-rose-100 text-rose-800 border-rose-200', border: 'border-l-rose-500', icon: '📉', cantColor: 'text-rose-600' };
      case 'Entrada Exterior': return { bg: 'bg-violet-100 text-violet-800 border-violet-200', border: 'border-l-violet-500', icon: '📦', cantColor: 'text-violet-600' };
      case 'Campo (Salida)': return { bg: 'bg-amber-100 text-amber-800 border-amber-200', border: 'border-l-amber-500', icon: '🌿', cantColor: 'text-amber-600' };
      case 'Campo (Entrada)': return { bg: 'bg-teal-100 text-teal-800 border-teal-200', border: 'border-l-teal-500', icon: '🔙', cantColor: 'text-teal-600' };
      default: return { bg: 'bg-gray-100 text-gray-800 border-gray-200', border: 'border-l-gray-400', icon: '📋', cantColor: 'text-gray-600' };
    }
  };

  const parseIdOperacion = (idOperacion) => {
    const parts = idOperacion.split('-');
    const code = parts[0];
    const id = parseInt(parts[1]);
    switch(code) {
      case 'PROD': return { endpoint: '/produccion', id, tab: 'produccion' };
      case 'TRAS': return { endpoint: '/cambios-presentacion', id, tab: 'cambio' };
      case 'BAJA': return { endpoint: '/descargos', id, tab: 'descargo' };
      case 'ENT': return { endpoint: '/entradas-exteriores', id, tab: 'entrada' };
      case 'CAMP': return { endpoint: '/campo', id, tab: 'campo' };
      default: return null;
    }
  };

  const handleVerDetalle = async (mov) => {
    const parsed = parseIdOperacion(mov.idOperacion);
    if (!parsed) return toast.error("Código de operación desconocido.");
    try {
      const res = await api.get(`${parsed.endpoint}/${parsed.id}`);
      setModalDetalle({ record: res.data, tab: parsed.tab, tipo: mov.tipo, idOperacion: mov.idOperacion });
    } catch (e) {
      toast.error("No se pudo cargar el detalle: " + e.message);
    }
  };

  const handleEditar = async (mov) => {
    const parsed = parseIdOperacion(mov.idOperacion);
    if (!parsed) return toast.error("Código de operación desconocido.");
    try {
      const res = await api.get(`${parsed.endpoint}/${parsed.id}`);
      navigate('/operaciones', { state: { editRecord: res.data, editTab: parsed.tab } });
    } catch (e) {
      toast.error("No se pudo cargar el registro para editar: " + e.message);
    }
  };

  const handleEliminar = async () => {
    if (!modalConfirmarEliminar) return;
    setEliminando(true);
    const parsed = parseIdOperacion(modalConfirmarEliminar.idOperacion);
    try {
      await api.delete(`${parsed.endpoint}/${parsed.id}`);
      toast.success("Registro eliminado. Inventario revertido.");
      setModalConfirmarEliminar(null);
      cargarBitacora();
    } catch (error) {
      toast.error("Error al eliminar: " + (error.response?.data || error.message));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-5 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="flex justify-between items-center flex-wrap gap-4 relative z-10">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bitácora General</h2>
            <p className="text-sm text-gray-500 mt-1.5 flex items-center">
              <ClipboardList className="w-4 h-4 mr-1.5 text-gray-400" />
              Historial cronológico completo de todas las operaciones y movimientos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 p-1 rounded-lg">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-none bg-transparent text-sm focus:ring-0 text-gray-700" />
              <span className="text-gray-400 font-medium">a</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-none bg-transparent text-sm focus:ring-0 text-gray-700" />
            </div>
            <button onClick={cargarBitacora} className="bg-white border border-gray-200 hover:bg-gray-50 hover:text-green-600 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Filtrar
            </button>
            <button onClick={exportarExcel} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center transform hover:-translate-y-0.5">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            <button onClick={abrirModalImportar} className="bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center transform hover:-translate-y-0.5">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 border-t border-gray-100 relative z-10">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Búsqueda rápida</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar por ID, empleado o detalle..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Filtrar por Operación</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select 
                value={filterTipo} 
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all shadow-inner appearance-none"
              >
                <option value="">Mostrar todas las operaciones</option>
                <option value="Producción">Producción</option>
                <option value="Cambio Presentación">Cambio Presentación</option>
                <option value="Descargo">Descargo</option>
                <option value="Entrada Exterior">Entrada Exterior</option>
                <option value="Campo (Salida)">Campo (Salida)</option>
                <option value="Campo (Entrada)">Campo (Entrada)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col min-h-[600px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">ID / Fecha</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Operación</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Personal</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-1/3">Detalle del Movimiento</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Cantidad</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-3" />
                    <span className="text-gray-500 font-medium">Cargando historial de operaciones...</span>
                  </td>
                </tr>
              ) : historial.length > 0 ? (
                historial.filter(mov => {
                  const searchLower = searchTerm.toLowerCase();
                  const matchesSearch = !searchTerm || 
                    (mov.idOperacion || '').toLowerCase().includes(searchLower) ||
                    (mov.empleado || '').toLowerCase().includes(searchLower) ||
                    (mov.detalle || '').toLowerCase().includes(searchLower);
                  const matchesTipo = !filterTipo || mov.tipo === filterTipo;
                  return matchesSearch && matchesTipo;
                }).map((mov, index) => {
                  const config = getTipoConfig(mov.tipo);
                  const isNegative = mov.tipo === 'Descargo' || mov.tipo === 'Campo (Salida)';
                  return (
                    <tr key={index} className={`hover:bg-gray-50 transition-colors group ${config.border} border-l-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block mb-1">{mov.idOperacion}</div>
                        <div className="text-xs text-gray-500 font-medium">{mov.fecha}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg} shadow-sm`}>
                          <span className="mr-1.5">{config.icon}</span>
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold mr-2">
                            {(mov.empleado || '').charAt(0) || '?'}
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{mov.empleado || 'No asignado'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed" title={mov.detalle}>{mov.detalle}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`text-base font-extrabold ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isNegative ? '-' : '+'}{mov.cantidad?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleVerDetalle(mov)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors" title="Ver detalle completo">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditar(mov)} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-md transition-colors" title="Editar operación">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setModalConfirmarEliminar(mov)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors" title="Eliminar y revertir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-gray-500">
                    <div className="bg-gray-50 inline-flex p-4 rounded-full mb-3">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-600">No hay operaciones registradas</p>
                    <p className="text-sm text-gray-400 mt-1">Ajusta los filtros o las fechas para buscar nuevamente.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in flex flex-col max-h-[90vh]">
            <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                  <span className="text-3xl drop-shadow-sm">{getTipoConfig(modalDetalle.tipo).icon}</span>
                  Detalle de Operación
                </h3>
                <p className="text-sm text-gray-500 font-mono mt-1 font-semibold ml-11">ID: {modalDetalle.idOperacion}</p>
              </div>
              <button onClick={() => setModalDetalle(null)} className="p-2.5 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all shadow-sm border border-gray-100 group">
                <X className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-white flex-1">
              {/* Información genérica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gray-50/80 rounded-2xl mb-8 border border-gray-100">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-50">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Tipo
                  </p>
                  <p className="font-extrabold text-gray-800 text-lg">{modalDetalle.tipo}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-50">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Fecha Operación
                  </p>
                  <p className="font-extrabold text-gray-800 text-lg">{modalDetalle.record.fecha}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-50">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Registro Sistema
                  </p>
                  <p className="font-bold text-gray-600 text-sm">{new Date(modalDetalle.record.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Por: {modalDetalle.record.createdBy || 'Sistema'}</p>
                </div>
              </div>

              {/* Campos dinámicos según el tipo de operación */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Datos Específicos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                  {modalDetalle.tab === 'produccion' && (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Destino</span>
                        <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                          {modalDetalle.record.plantaPresentacion ? `[${modalDetalle.record.plantaPresentacion.codigo}] ${modalDetalle.record.plantaPresentacion.presentacion?.nombre}` : 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad Producida</span>
                        <p className="text-xl text-emerald-600 font-black bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          +{modalDetalle.record.cantidad}
                        </p>
                      </div>
                      {modalDetalle.record.origenes?.length > 0 && (
                        <div className="space-y-1 md:col-span-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Módulos/Viveros Origen</span>
                          <div className="flex flex-wrap gap-2 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {modalDetalle.record.origenes.map(o => (
                              <span key={o.id} className="text-xs bg-white shadow-sm font-bold text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200">
                                {o.codigo} - {o.nombre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tiempo de Siembra</span>
                        <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                          {modalDetalle.record.siembraTiempoHoras || '0'} Horas
                        </p>
                      </div>
                    </>
                  )}

                  {modalDetalle.tab === 'cambio' && (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Destino Resultante</span>
                        <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                          {modalDetalle.record.destino ? `[${modalDetalle.record.destino.codigo}] ${modalDetalle.record.destino.presentacion?.nombre}` : 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad Destino</span>
                        <p className="text-xl text-sky-600 font-black bg-sky-50 p-3 rounded-xl border border-sky-100">
                          +{modalDetalle.record.cantidadDestino}
                        </p>
                      </div>
                      {modalDetalle.record.detalles?.length > 0 && (
                        <div className="space-y-1 md:col-span-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lotes Origen Utilizados (Restados)</span>
                          <div className="space-y-2 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {modalDetalle.record.detalles.map(d => (
                              <div key={d.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                <span className="text-sm font-medium text-gray-700">[{d.origen?.codigo}] {d.origen?.presentacion?.nombre}</span>
                                <span className="font-black text-rose-600 text-lg bg-rose-50 px-3 py-1 rounded-md">-{d.cantidadOrigen}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {modalDetalle.tab === 'descargo' && (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Afectado</span>
                        <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                          {modalDetalle.record.plantaPresentacion ? `[${modalDetalle.record.plantaPresentacion.codigo}] ${modalDetalle.record.plantaPresentacion.presentacion?.nombre}` : 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad de Baja</span>
                        <p className="text-xl text-rose-600 font-black bg-rose-50 p-3 rounded-xl border border-rose-100">
                          -{modalDetalle.record.cantidad}
                        </p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Motivo del Descargo</span>
                        <p className="text-base text-gray-800 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                          "{modalDetalle.record.motivoDescargo}"
                        </p>
                      </div>
                    </>
                  )}

                  {modalDetalle.tab === 'entrada' && (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tipo de Entrada</span>
                        <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100 capitalize">
                          {modalDetalle.record.tipo}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad Ingresada</span>
                        <p className="text-xl text-violet-600 font-black bg-violet-50 p-3 rounded-xl border border-violet-100">
                          +{modalDetalle.record.cantidad}
                        </p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Destino</span>
                        <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                          {modalDetalle.record.plantaPresentacion ? `[${modalDetalle.record.plantaPresentacion.codigo}] ${modalDetalle.record.plantaPresentacion.presentacion?.nombre}` : 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Detalle / Proveedor</span>
                        <p className="text-base text-gray-800 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                          {modalDetalle.record.detalle}
                        </p>
                      </div>
                      {modalDetalle.record.totalPrecio != null && (
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Costo Total</span>
                          <p className="text-xl text-emerald-700 font-black bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            ${modalDetalle.record.totalPrecio.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {modalDetalle.tab === 'campo' && (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Acción de Campo</span>
                        <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                          {modalDetalle.record.tipo === 'Salida' ? 'Sembrar a campo (Salida de Inv.)' : 'Sacar de campo (Entrada a Inv.)'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad</span>
                        <p className={`text-xl font-black p-3 rounded-xl border ${modalDetalle.record.tipo === 'Salida' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-teal-600 bg-teal-50 border-teal-100'}`}>
                          {modalDetalle.record.tipo === 'Salida' ? '-' : '+'}{modalDetalle.record.cantidad}
                        </p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Asociado</span>
                        <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                          {modalDetalle.record.plantaPresentacion ? `[${modalDetalle.record.plantaPresentacion.codigo}] ${modalDetalle.record.plantaPresentacion.presentacion?.nombre}` : 'N/A'}
                        </p>
                      </div>
                      {modalDetalle.record.lugares?.length > 0 && (
                        <div className="space-y-1 md:col-span-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Ubicaciones en Campo</span>
                          <div className="flex flex-wrap gap-2 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {modalDetalle.record.lugares.map(l => (
                              <span key={l.id} className="text-xs bg-white shadow-sm font-bold text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200">
                                {l.codigo} - {l.nombre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Mostrar Trabajadores si hay */}
              {modalDetalle.record.trabajadores?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Personal Asignado</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {modalDetalle.record.trabajadores.map(t => (
                      <div key={t.id} className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {t.nombre.charAt(0)}{t.apellido.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-gray-700 leading-tight">{t.nombre} {t.apellido}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => {
                const mov = modalDetalle;
                setModalDetalle(null);
                handleEditar(mov);
              }} className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-medium transition-colors flex items-center">
                <Pencil className="w-4 h-4 mr-2" /> Editar
              </button>
              <button onClick={() => setModalDetalle(null)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {modalConfirmarEliminar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar registro?</h3>
              <p className="text-gray-500 text-sm mb-1">ID: <span className="font-mono font-bold text-gray-700">{modalConfirmarEliminar.idOperacion}</span></p>
              <p className="text-red-600 text-sm font-medium p-3 bg-red-50 rounded-lg border border-red-100 mt-4">
                Esta acción revertirá los movimientos de inventario asociados. No se puede deshacer.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setModalConfirmarEliminar(null)} 
                disabled={eliminando}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleEliminar} 
                disabled={eliminando}
                className="flex-1 flex items-center justify-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {eliminando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar Excel Bitácora */}
      {modalImportar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Importar Operaciones</h3>
                  <p className="text-xs text-gray-500">Carga masiva de operaciones desde archivo Excel</p>
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
                onDrop={handleDropBitacora}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                  ${dragOver ? 'border-blue-500 bg-blue-50 scale-[1.02]' : archivoImportar ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                onClick={() => document.getElementById('file-input-bitacora').click()}
              >
                <input
                  id="file-input-bitacora"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelectBitacora}
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
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Tipo</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Fecha</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Código Lote</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Cantidad</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Detalle</th>
                        <th className="border border-gray-200 px-2 py-1.5 text-gray-600 font-bold">Empleado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">Producción</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">2024-03-01</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500 font-mono">PQCA01001</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">50</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">Siembra</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">Juan Pérez</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">Descargo</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">2024-03-02</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500 font-mono">PQCA01001</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">5</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">Muertas</td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-500">12345678-9</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Producción</span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Descargo</span>
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">Entrada Exterior</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Compra</span>
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-bold">Devolución</span>
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