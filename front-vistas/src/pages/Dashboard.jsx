import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

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
        responseType: 'blob', // Importante para recibir archivos binarios
        params: { startDate, endDate }
      });
      // Crear URL para el blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bitacora.xlsx'); // Nombre del archivo a descargar
      document.body.appendChild(link);
      link.click();
      // Limpieza
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exportando a Excel", error);
      toast.error("No se pudo exportar la bitácora a Excel.");
    }
  };

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case 'Producción': return 'bg-green-100 text-green-800 border-green-200';
      case 'Trasplante': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Descargo': return 'bg-red-100 text-red-800 border-red-200';
      case 'Entrada Exterior': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Campo (Salida)': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Campo (Entrada)': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">Bitácora General</h2>
            <p className="text-sm text-gray-500 mt-1">Historial cronológico de todos los movimientos del vivero.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 p-1 rounded-md">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-none bg-transparent text-sm focus:ring-0 text-gray-700" />
            <span className="text-gray-400">a</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-none bg-transparent text-sm focus:ring-0 text-gray-700" />
          </div>
          <button onClick={cargarBitacora} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors">
            ↻ Filtrar
          </button>
          <button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Exportar Excel
          </button>
        </div>
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
            <input 
              type="text" 
              placeholder="Buscar por ID, Empleado o Detalle..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-gray-300 rounded-md p-2 border bg-gray-50 text-sm focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Filtrar por Tipo</label>
            <select 
              value={filterTipo} 
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full border-gray-300 rounded-md p-2 border bg-gray-50 text-sm focus:ring-green-500"
            >
              <option value="">Todas las Operaciones</option>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">ID Operación</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Empleado</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Detalle del Movimiento</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Cargando historial...</td></tr>
              ) : historial.length > 0 ? (
                historial.filter(mov => {
                  const searchLower = searchTerm.toLowerCase();
                  const matchesSearch = !searchTerm || 
                    mov.idOperacion.toLowerCase().includes(searchLower) ||
                    mov.empleado.toLowerCase().includes(searchLower) ||
                    mov.detalle.toLowerCase().includes(searchLower);
                  
                  const matchesTipo = !filterTipo || mov.tipo === filterTipo;
                  
                  return matchesSearch && matchesTipo;
                }).map((mov, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{mov.idOperacion}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{mov.fecha}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(mov.tipo)}`}>
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{mov.empleado}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{mov.detalle}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      {mov.tipo === 'Descargo' ? '-' : '+'}{mov.cantidad}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No hay operaciones registradas aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
            <input 
              type="text" 
              placeholder="Buscar por ID, Empleado o Detalle..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-gray-300 rounded-md p-2 border bg-gray-50 text-sm focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Filtrar por Tipo</label>
            <select 
              value={filterTipo} 
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full border-gray-300 rounded-md p-2 border bg-gray-50 text-sm focus:ring-green-500"
            >
              <option value="">Todas las Operaciones</option>
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
  );
}