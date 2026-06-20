import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Dashboard() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarBitacora();
  }, []);

  const cargarBitacora = async () => {
    try {
      const res = await api.get('/bitacora');
      setHistorial(res.data);
      setCargando(false);
    } catch (error) {
      console.error("Error cargando la bitácora", error);
      setCargando(false);
    }
  };

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case 'Producción': return 'bg-green-100 text-green-800 border-green-200';
      case 'Trasplante': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Descargo': return 'bg-red-100 text-red-800 border-red-200';
      case 'Entrada Exterior': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Bitácora General</h2>
          <p className="text-sm text-gray-500 mt-1">Historial cronológico de todos los movimientos del vivero.</p>
        </div>
        <button onClick={cargarBitacora} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors">
          ↻ Refrescar
        </button>
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
                historial.map((mov, index) => (
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
    </div>
  );
}