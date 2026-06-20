import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Operaciones() {
  const [tabActivo, setTabActivo] = useState('produccion');
  
  // Catálogos para los selects
  const [empleados, setEmpleados] = useState([]);
  const [inventario, setInventario] = useState([]); // Vínculos de Planta_Presentacion
  const [origenes, setOrigenes] = useState([]);

  // Fecha de hoy por defecto para los formularios (YYYY-MM-DD)
  const hoy = new Date().toISOString().split('T')[0];

  // Estados de los Formularios
  const formBase = { fecha: hoy, trabajadorId: '', plantaPresentacionId: '', cantidad: '' };
  
  const [formProduccion, setFormProduccion] = useState({ ...formBase, origenId: '', siembraTiempoHoras: '' });
  const [formCambio, setFormCambio] = useState({ fecha: hoy, trabajadorId: '', origenId: '', destinoId: '', cantidad: '' });
  const [formDescargo, setFormDescargo] = useState({ ...formBase, detalle: '' });
  const [formEntrada, setFormEntrada] = useState({ ...formBase, tipo: 'compra', detalle: '', totalPrecio: '' });

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [resEmpleados, resInv, resOrigenes] = await Promise.all([
        api.get('/empleados'),
        api.get('/planta-presentacion'),
        api.get('/origenes')
      ]);
      setEmpleados(resEmpleados.data);
      setInventario(resInv.data);
      setOrigenes(resOrigenes.data);
    } catch (error) {
      console.error("Error cargando catálogos para operaciones", error);
    }
  };

  // --- HANDLERS DE ENVÍO ---

  const handleSubmitProduccion = async (e) => {
    e.preventDefault();
    try {
      await api.post('/produccion', {
        fecha: formProduccion.fecha,
        trabajador: { id: formProduccion.trabajadorId },
        plantaPresentacion: { id: formProduccion.plantaPresentacionId },
        origen: { id: formProduccion.origenId },
        cantidad: Number(formProduccion.cantidad),
        siembraTiempoHoras: Number(formProduccion.siembraTiempoHoras),
        createdBy: 'Liliam' // Simulación de usuario logueado
      });
      alert("Producción registrada con éxito. Inventario actualizado.");
      setFormProduccion({ ...formBase, origenId: '', siembraTiempoHoras: '' });
      cargarCatalogos(); // Refrescar inventario
    } catch (error) { alert("Error: " + (error.response?.data || error.message)); }
  };

  const handleSubmitCambio = async (e) => {
    e.preventDefault();
    if (formCambio.origenId === formCambio.destinoId) {
      alert("El origen y el destino no pueden ser el mismo."); return;
    }
    try {
      await api.post('/cambios-presentacion', {
        fecha: formCambio.fecha,
        trabajador: { id: formCambio.trabajadorId },
        origen: { id: formCambio.origenId },
        destino: { id: formCambio.destinoId },
        cantidad: Number(formCambio.cantidad),
        createdBy: 'Liliam'
      });
      alert("Trasplante registrado con éxito. Inventario actualizado.");
      setFormCambio({ fecha: hoy, trabajadorId: '', origenId: '', destinoId: '', cantidad: '' });
      cargarCatalogos();
    } catch (error) { alert("Error: " + (error.response?.data || error.message)); }
  };

  const handleSubmitDescargo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/descargos', {
        fecha: formDescargo.fecha,
        trabajador: { id: formDescargo.trabajadorId },
        plantaPresentacion: { id: formDescargo.plantaPresentacionId },
        cantidad: Number(formDescargo.cantidad),
        motivoDescargo: formDescargo.detalle,
        createdBy: 'Liliam'
      });
      alert("Descargo/Merma registrado con éxito. Inventario actualizado.");
      setFormDescargo({ ...formBase, detalle: '' });
      cargarCatalogos();
    } catch (error) { alert("Error: " + (error.response?.data || error.message)); }
  };

  const handleSubmitEntrada = async (e) => {
    e.preventDefault();
    try {
      await api.post('/entradas-exteriores', {
        fecha: formEntrada.fecha,
        trabajador: { id: formEntrada.trabajadorId },
        plantaPresentacion: { id: formEntrada.plantaPresentacionId },
        tipo: formEntrada.tipo,
        cantidad: Number(formEntrada.cantidad),
        detalle: formEntrada.detalle,
        totalPrecio: formEntrada.totalPrecio ? Number(formEntrada.totalPrecio) : null,
        createdBy: 'Liliam'
      });
      alert("Entrada Exterior registrada con éxito. Inventario actualizado.");
      setFormEntrada({ ...formBase, tipo: 'compra', detalle: '', totalPrecio: '' });
      cargarCatalogos();
    } catch (error) { alert("Error: " + (error.response?.data || error.message)); }
  };

  // --- RENDERIZADO CONDICIONAL DE FORMULARIOS ---
  const SelectorTrabajador = ({ valor, setValor }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Trabajador</label>
      <select required value={valor} onChange={setValor} className="w-full border-gray-300 rounded-md p-2 border bg-white focus:ring-green-500">
        <option value="">-- Seleccionar --</option>
        {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>)}
      </select>
    </div>
  );

  const SelectorInventario = ({ label, valor, setValor, opciones = inventario }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select required value={valor} onChange={setValor} className="w-full border-gray-300 rounded-md p-2 border bg-white focus:ring-green-500">
        <option value="">-- Seleccionar Lote/Planta --</option>
        {opciones.map(i => (
          <option key={i.id} value={i.id}>
            [{i.codigo}] {i.planta?.nombre} - {i.presentacion?.nombre} (Stock: {i.stock})
          </option>
        ))}
      </select>
    </div>
  );

  const loteOrigenSeleccionado = inventario.find(i => i.id.toString() === formCambio.origenId.toString());
  const inventarioDestinoFiltrado = loteOrigenSeleccionado
    ? inventario.filter(i => i.planta?.id === loteOrigenSeleccionado.planta?.id && i.id !== loteOrigenSeleccionado.id)
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-extrabold text-gray-800">Operaciones Diarias</h2>
        <p className="text-sm text-gray-500 mt-1">Registro de movimientos que afectan el inventario maestro.</p>
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
        {[
          { id: 'produccion', nombre: 'Producción (Siembra)' },
          { id: 'cambio', nombre: 'Cambio de Presentación' },
          { id: 'descargo', nombre: 'Descargo (Mermas)' },
          { id: 'entrada', nombre: 'Entrada Exterior' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActivo(tab.id)}
            className={`flex-1 py-4 font-medium text-sm transition-colors duration-200 ${
              tabActivo === tab.id 
                ? 'border-b-2 border-green-600 text-green-700 bg-green-50/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.nombre}
          </button>
        ))}
      </div>

      {/* Contenedor del Formulario Activo */}
      <div className="bg-white p-8 rounded-b-xl shadow-sm border border-t-0 border-gray-100">
        
        {/* 1. PRODUCCIÓN */}
        {tabActivo === 'produccion' && (
          <form onSubmit={handleSubmitProduccion} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input required type="date" value={formProduccion.fecha} onChange={e => setFormProduccion({...formProduccion, fecha: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
              <SelectorTrabajador valor={formProduccion.trabajadorId} setValor={e => setFormProduccion({...formProduccion, trabajadorId: e.target.value})} />
              
              <div className="md:col-span-2">
                <SelectorInventario label="Lote de Destino (Inventario a Sumar)" valor={formProduccion.plantaPresentacionId} setValor={e => setFormProduccion({...formProduccion, plantaPresentacionId: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origen del Material</label>
                <select required value={formProduccion.origenId} onChange={e => setFormProduccion({...formProduccion, origenId: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border bg-white">
                  <option value="">-- Seleccionar Origen --</option>
                  {origenes.map(o => <option key={o.id} value={o.id}>{o.codigo} - {o.nombre}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Producida</label>
                  <input required type="number" min="1" value={formProduccion.cantidad} onChange={e => setFormProduccion({...formProduccion, cantidad: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo (Horas)</label>
                  <input required type="number" step="0.5" min="0" value={formProduccion.siembraTiempoHoras} onChange={e => setFormProduccion({...formProduccion, siembraTiempoHoras: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" placeholder="Ej: 2.5" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-md transition-colors shadow-sm">Registrar Producción</button>
          </form>
        )}

        {/* 2. CAMBIO DE PRESENTACIÓN */}
        {tabActivo === 'cambio' && (
          <form onSubmit={handleSubmitCambio} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input required type="date" value={formCambio.fecha} onChange={e => setFormCambio({...formCambio, fecha: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
              <SelectorTrabajador valor={formCambio.trabajadorId} setValor={e => setFormCambio({...formCambio, trabajadorId: e.target.value})} />
              
              <div className="md:col-span-2 border-l-4 border-red-500 pl-4 py-2 bg-red-50/50 rounded-r-md">
                <SelectorInventario 
                  label="Origen (De dónde se sacan las plantas - RESTA STOCK)" 
                  valor={formCambio.origenId} 
                  setValor={e => {
                    // Si cambia el origen, limpiamos el destino para que no quede basura
                    setFormCambio({...formCambio, origenId: e.target.value, destinoId: ''});
                  }} 
                />
              </div>

              <div className="md:col-span-2 border-l-4 border-green-500 pl-4 py-2 bg-green-50/50 rounded-r-md">
                <SelectorInventario 
                  label="Destino (A qué presentación pasan - SUMA STOCK)" 
                  valor={formCambio.destinoId} 
                  setValor={e => setFormCambio({...formCambio, destinoId: e.target.value})} 
                  opciones={inventarioDestinoFiltrado} // <-- AQUÍ APLICAMOS EL FILTRO
                />
                {formCambio.origenId && inventarioDestinoFiltrado.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    * No hay otros lotes de esta misma planta registrados en el inventario. Ve a Catálogos a crear el vínculo primero.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Trasplantar</label>
                <input required type="number" min="1" value={formCambio.cantidad} onChange={e => setFormCambio({...formCambio, cantidad: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors shadow-sm">Registrar Trasplante</button>
          </form>
        )}

        {/* 3. DESCARGOS */}
        {tabActivo === 'descargo' && (
          <form onSubmit={handleSubmitDescargo} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input required type="date" value={formDescargo.fecha} onChange={e => setFormDescargo({...formDescargo, fecha: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
              <SelectorTrabajador valor={formDescargo.trabajadorId} setValor={e => setFormDescargo({...formDescargo, trabajadorId: e.target.value})} />
              
              <div className="md:col-span-2">
                <SelectorInventario label="Lote Afectado (Se restará stock)" valor={formDescargo.plantaPresentacionId} setValor={e => setFormDescargo({...formDescargo, plantaPresentacionId: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Dar de Baja</label>
                <input required type="number" min="1" value={formDescargo.cantidad} onChange={e => setFormDescargo({...formDescargo, cantidad: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Detalle</label>
                <input required type="text" value={formDescargo.detalle} onChange={e => setFormDescargo({...formDescargo, detalle: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" placeholder="Ej: Plantas marchitas por hongo" />
              </div>
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition-colors shadow-sm">Registrar Descargo</button>
          </form>
        )}

        {/* 4. ENTRADA EXTERIOR */}
        {tabActivo === 'entrada' && (
          <form onSubmit={handleSubmitEntrada} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input required type="date" value={formEntrada.fecha} onChange={e => setFormEntrada({...formEntrada, fecha: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
              <SelectorTrabajador valor={formEntrada.trabajadorId} setValor={e => setFormEntrada({...formEntrada, trabajadorId: e.target.value})} />
              
              <div className="md:col-span-2">
                <SelectorInventario label="Lote de Destino (Inventario a Sumar)" valor={formEntrada.plantaPresentacionId} setValor={e => setFormEntrada({...formEntrada, plantaPresentacionId: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entrada</label>
                  <select required value={formEntrada.tipo} onChange={e => setFormEntrada({...formEntrada, tipo: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border bg-white">
                    <option value="compra">Compra a Proveedor</option>
                    <option value="devolucion">Devolución de Cliente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input required type="number" min="1" value={formEntrada.cantidad} onChange={e => setFormEntrada({...formEntrada, cantidad: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Total ($) - Opcional</label>
                  <input type="number" step="0.01" min="0" value={formEntrada.totalPrecio} onChange={e => setFormEntrada({...formEntrada, totalPrecio: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detalle</label>
                  <input required type="text" value={formEntrada.detalle} onChange={e => setFormEntrada({...formEntrada, detalle: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" placeholder="Ej: Compra a Vivero San Miguel" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-md transition-colors shadow-sm">Registrar Entrada</button>
          </form>
        )}

      </div>
    </div>
  );
}