import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      setCargando(true);
      const res = await api.get('/planta-presentacion');
      setInventario(res.data);
      setCargando(false);
    } catch (error) {
      console.error("Error cargando el inventario", error);
      setCargando(false);
    }
  };

  // Filtrado múltiple: por código, nombre de planta o presentación
  const filtrados = inventario.filter(item => {
    const termino = busqueda.toLowerCase();
    const codigo = item.codigo?.toLowerCase() || '';
    const planta = item.planta?.nombre?.toLowerCase() || '';
    const presentacion = item.presentacion?.nombre?.toLowerCase() || '';
    
    return codigo.includes(termino) || planta.includes(termino) || presentacion.includes(termino);
  });

  // Función para determinar el color del badge de Stock (Semáforo)
  const getStockBadge = (stock) => {
    if (stock <= 10) return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Crítico ({stock})</span>;
    if (stock <= 50) return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Bajo ({stock})</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Óptimo ({stock})</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado y Buscador */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Inventario Maestro</h2>
          <p className="text-sm text-gray-500 mt-1">Consulta el stock actual de todas las plantas y presentaciones.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-96">
          <input 
            type="text" 
            placeholder="Buscar planta, código o maceta..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500 focus:border-green-500"
          />
          <button onClick={cargarInventario} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md font-medium transition-colors" title="Refrescar">
            ↻
          </button>
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Código Lote</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Planta</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Presentación / Tamaño</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Detalle</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Stock Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">Cargando inventario...</td></tr>
              ) : filtrados.length > 0 ? (
                filtrados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-700">
                      {item.codigo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{item.planta?.nombre}</div>
                      <div className="text-xs text-gray-500 italic">{item.planta?.nombreCientifico}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800">{item.presentacion?.nombre}</div>
                      <div className="text-xs text-gray-500">Tamaño: {item.tamanio || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">
                      {item.detalle || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {getStockBadge(item.stock)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <p className="text-gray-500 text-lg">No se encontraron lotes en el inventario.</p>
                    <p className="text-gray-400 text-sm mt-1">Intenta con otra búsqueda o ve a Catálogos para registrar nuevos.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}