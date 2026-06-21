import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idActual, setIdActual] = useState(null);
  
  const [formulario, setFormulario] = useState({
    nombre: '', apellido: '', dui: '', numero: '', fechaContratacion: '', createdBy: 'Admin'
  });

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

  const filtrados = empleados.filter(e => 
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) || 
    e.dui.includes(busqueda)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-extrabold text-gray-800">Gestión de Personal</h2>
        <p className="text-sm text-gray-500 mt-1">Administración de la planilla de trabajadores de CAPOSA.</p>
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
    </div>
  );
}