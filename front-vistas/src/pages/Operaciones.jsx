import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Operaciones() {
  const [tabActivo, setTabActivo] = useState('produccion');
  
  // Catálogos para los selects
  const [empleados, setEmpleados] = useState([]);
  const [inventario, setInventario] = useState([]); // Vínculos de Planta_Presentacion
  const [origenes, setOrigenes] = useState([]);

  // Fecha de hoy por defecto para los formularios (YYYY-MM-DD)
  const hoy = new Date().toISOString().split('T')[0];

  // Estados de los Formularios
  const formBase = { fecha: hoy, trabajadoresIds: [], plantaPresentacionId: '', cantidad: '' };
  
  const [formProduccion, setFormProduccion] = useState({ ...formBase, origenesIds: [], siembraTiempoHoras: '' });
  const [formCambio, setFormCambio] = useState({ 
    fecha: hoy, 
    trabajadoresIds: [], 
    destinoId: '', 
    cantidadDestino: '',
    detalles: [{ origenId: '', cantidad: '' }]
  });
  
  const [formDescargo, setFormDescargo] = useState({ ...formBase, detalle: '' });
  const [formEntrada, setFormEntrada] = useState({ ...formBase, tipo: 'compra', detalle: '', totalPrecio: '' });
  
  const [formCampo, setFormCampo] = useState({ 
    fecha: hoy, 
    trabajadoresIds: [], 
    plantaPresentacionId: '', 
    cantidad: '', 
    tipo: 'Salida', 
    lugaresIds: [],
    // Para selects en cascada en Entrada
    plantaIdTemp: ''
  });

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
    if (formProduccion.origenesIds.length === 0) {
      toast.error("Debes seleccionar al menos un origen.");
      return;
    }

    try {
      await api.post('/produccion', {
        fecha: formProduccion.fecha,
        trabajadores: formProduccion.trabajadoresIds.map(id => ({ id: Number(id) }) ),
        plantaPresentacion: { id: formProduccion.plantaPresentacionId },
        origenes: formProduccion.origenesIds.map(id => ({ id })),
        cantidad: Number(formProduccion.cantidad),
        siembraTiempoHoras: Number(formProduccion.siembraTiempoHoras),
        createdBy: 'Liliam' // Simulación de usuario logueado
      });
      toast.success("Producción registrada con éxito. Inventario actualizado.");
      setFormProduccion({ ...formBase, origenesIds: [], siembraTiempoHoras: '' });
      cargarCatalogos(); // Refrescar inventario
    } catch (error) { toast.error("Error: " + (error.response?.data || error.message)); }
  };

  const handleAddDetalleCambio = () => {
    setFormCambio({
      ...formCambio,
      detalles: [...formCambio.detalles, { origenId: '', cantidad: '' }]
    });
  };

  const handleRemoveDetalleCambio = (index) => {
    const nuevosDetalles = formCambio.detalles.filter((_, i) => i !== index);
    setFormCambio({ ...formCambio, detalles: nuevosDetalles });
  };

  const handleChangeDetalle = (index, field, value) => {
    const nuevosDetalles = [...formCambio.detalles];
    nuevosDetalles[index][field] = value;
    setFormCambio({ ...formCambio, detalles: nuevosDetalles });
  };

  const handleSubmitCambio = async (e) => {
    e.preventDefault();
    
    // Validar que no haya duplicados o vacíos
    for (const det of formCambio.detalles) {
      if (!det.origenId || !det.cantidad) {
        toast.error("Todos los orígenes deben tener planta y cantidad."); return;
      }
      if (det.origenId == formCambio.destinoId) {
        toast.error("Un origen no puede ser igual al destino."); return;
      }
    }

    try {
      await api.post('/cambios-presentacion', {
        fecha: formCambio.fecha,
        trabajadores: formCambio.trabajadoresIds.map(id => ({ id: Number(id) }) ),
        destino: { id: formCambio.destinoId },
        cantidadDestino: Number(formCambio.cantidadDestino),
        detalles: formCambio.detalles.map(d => ({
          origen: { id: d.origenId },
          cantidadOrigen: Number(d.cantidad)
        })),
        createdBy: 'Liliam'
      });
      toast.success("Trasplante/Armado registrado con éxito. Inventario actualizado.");
      setFormCambio({ fecha: hoy, trabajadoresIds: [], destinoId: '', cantidadDestino: '', detalles: [{ origenId: '', cantidad: '' }] });
      cargarCatalogos();
    } catch (error) { toast.error("Error: " + (error.response?.data || error.message)); }
  };

  const handleSubmitDescargo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/descargos', {
        fecha: formDescargo.fecha,
        trabajadores: formDescargo.trabajadoresIds.map(id => ({ id: Number(id) }) ),
        plantaPresentacion: { id: formDescargo.plantaPresentacionId },
        cantidad: Number(formDescargo.cantidad),
        motivoDescargo: formDescargo.detalle,
        createdBy: 'Liliam'
      });
      toast.success("Descargo/Merma registrado con éxito. Inventario actualizado.");
      setFormDescargo({ ...formBase, detalle: '' });
      cargarCatalogos();
    } catch (error) { toast.error("Error: " + (error.response?.data || error.message)); }
  };

  const handleSubmitEntrada = async (e) => {
    e.preventDefault();
    try {
      await api.post('/entradas-exteriores', {
        fecha: formEntrada.fecha,
        trabajadores: formEntrada.trabajadoresIds.map(id => ({ id: Number(id) }) ),
        plantaPresentacion: { id: formEntrada.plantaPresentacionId },
        tipo: formEntrada.tipo,
        cantidad: Number(formEntrada.cantidad),
        detalle: formEntrada.detalle,
        totalPrecio: formEntrada.totalPrecio ? Number(formEntrada.totalPrecio) : null,
        createdBy: 'Liliam'
      });
      toast.success("Entrada Exterior registrada con éxito. Inventario actualizado.");
      setFormEntrada({ ...formBase, tipo: 'compra', detalle: '', totalPrecio: '' });
      cargarCatalogos();
    } catch (error) { toast.error("Error: " + (error.response?.data || error.message)); }
  };

  const handleSubmitCampo = async (e) => {
    e.preventDefault();
    if (formCampo.lugaresIds.length === 0) {
      toast.error("Debes seleccionar al menos un lugar de siembra/extracción.");
      return;
    }
    try {
      await api.post('/campo', {
        fecha: formCampo.fecha,
        tipo: formCampo.tipo,
        cantidad: Number(formCampo.cantidad),
        plantaPresentacionId: Number(formCampo.plantaPresentacionId),
        trabajadorIds: formCampo.trabajadoresIds.map(Number),
        lugarIds: formCampo.lugaresIds.map(Number)
      });
      toast.success(`Operación de Campo (${formCampo.tipo}) registrada con éxito.`);
      setFormCampo({ ...formCampo, trabajadoresIds: [], plantaPresentacionId: '', cantidad: '', lugaresIds: [], plantaIdTemp: '' });
      cargarCatalogos();
    } catch (error) { toast.error("Error: " + (error.response?.data || error.message)); }
  };

  // --- HELPERS PARA FILTRADO INTELIGENTE ---
  const plantasUnicas = Array.from(new Map(
    inventario.map(i => {
      if (i.esArregloCombinado) return ['arreglo', { id: 'arreglo', nombre: 'Arreglo Combinado' }];
      if (i.planta) return [i.planta.id, i.planta];
      return [null, null];
    }).filter(x => x[0] !== null)
  ).values());

  const getPresentacionesPorPlanta = (plantaId) => {
    if (!plantaId) return [];
    return inventario.filter(i => 
      (plantaId === 'arreglo' && i.esArregloCombinado) ||
      (i.planta && String(i.planta.id) === String(plantaId))
    );
  };

  const getOrigenesDisponibles = (indexFiltrar) => {
    let disponibles = inventario.filter(i => i.stock > 0);
    const seleccionados = formCambio.detalles.map((d, i) => i !== indexFiltrar ? Number(d.origenId) : null).filter(Boolean);
    return disponibles.filter(i => !seleccionados.includes(i.id));
  };

  const getDestinosFiltrados = () => {
    const origenesValidos = formCambio.detalles.filter(d => d.origenId);
    if (origenesValidos.length === 0) return inventario;

    const plantasIds = new Set();
    origenesValidos.forEach(d => {
      const inv = inventario.find(i => i.id === Number(d.origenId));
      if (inv && inv.planta) {
        plantasIds.add(inv.planta.id);
      }
    });

    if (plantasIds.size > 1) {
      return inventario.filter(i => i.esArregloCombinado);
    } else if (plantasIds.size === 1) {
      const plantaId = Array.from(plantasIds)[0];
      return inventario.filter(i => i.esArregloCombinado || (i.planta && i.planta.id === plantaId));
    }
    return inventario;
  };

  // --- RENDERIZADO CONDICIONAL DE FORMULARIOS ---
  const SelectorTrabajador = ({ valor, setValor }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Trabajadores (Puedes seleccionar varios)</label>
      <select multiple required value={valor} onChange={e => {
        const values = Array.from(e.target.selectedOptions, option => option.value);
        setValor(values);
      }} className="w-full border-gray-300 rounded-md p-2 border bg-white focus:ring-green-500 h-24 text-sm">
        {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>)}
      </select>
    </div>
  );

  const SelectorInventario = ({ label, valor, setValor, opciones = inventario }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select required value={valor} onChange={setValor} className="w-full border-gray-300 rounded-md p-2 border bg-white focus:ring-green-500 text-sm">
        <option value="">-- Seleccionar Lote/Planta --</option>
        {opciones.map(i => (
          <option key={i.id} value={i.id}>
            [{i.codigo}] {i.esArregloCombinado ? 'Arreglo Combinado' : i.planta?.nombre} - {i.presentacion?.nombre} (Stock: {i.stock})
          </option>
        ))}
      </select>
    </div>
  );

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
          { id: 'entrada', nombre: 'Entrada Exterior' },
          { id: 'campo', nombre: 'Sembrado a Campo' }
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
              <SelectorTrabajador valor={formProduccion.trabajadoresIds} setValor={values => setFormProduccion({...formProduccion, trabajadoresIds: values})} />
              
              <div className="md:col-span-2">
                <SelectorInventario label="Lote de Destino (Inventario a Sumar)" valor={formProduccion.plantaPresentacionId} setValor={e => setFormProduccion({...formProduccion, plantaPresentacionId: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orígenes del Material (Puedes elegir varios con Ctrl o Cmd)</label>
                <select multiple required value={formProduccion.origenesIds} onChange={e => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setFormProduccion({...formProduccion, origenesIds: values});
                }} className="w-full border-gray-300 rounded-md p-2 border bg-white h-32">
                  {origenes.map(o => <option key={o.id} value={o.id}>{o.codigo} - {o.nombre}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
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
              <SelectorTrabajador valor={formCambio.trabajadoresIds} setValor={values => setFormCambio({...formCambio, trabajadoresIds: values})} />
              
              <div className="md:col-span-2 border-l-4 border-red-500 p-4 bg-red-50/50 rounded-r-md">
                <h4 className="font-bold text-red-700 mb-4">Orígenes (Plantas a descontar)</h4>
                
                {formCambio.detalles.map((detalle, index) => (
                  <div key={index} className="flex gap-4 items-end mb-4 bg-white p-3 rounded shadow-sm border border-red-100">
                    <div className="flex-1">
                      <SelectorInventario 
                        label={`Planta / Lote ${index + 1}`}
                        valor={detalle.origenId} 
                        setValor={e => handleChangeDetalle(index, 'origenId', e.target.value)} 
                        opciones={getOrigenesDisponibles(index)}
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input required type="number" min="1" value={detalle.cantidad} onChange={e => handleChangeDetalle(index, 'cantidad', e.target.value)} className="w-full border-gray-300 rounded-md p-2 border" />
                    </div>
                    {formCambio.detalles.length > 1 && (
                      <button type="button" onClick={() => handleRemoveDetalleCambio(index)} className="bg-red-100 text-red-600 px-3 py-2 rounded font-bold hover:bg-red-200 h-[42px]">X</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={handleAddDetalleCambio} className="text-sm font-semibold text-red-600 bg-white border border-red-200 px-4 py-2 rounded hover:bg-red-50">+ Añadir otro origen</button>
              </div>

              <div className="md:col-span-2 border-l-4 border-green-500 p-4 bg-green-50/50 rounded-r-md">
                <h4 className="font-bold text-green-700 mb-4">Destino (Planta/Arreglo a Sumar)</h4>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <SelectorInventario 
                      label="Presentación Final" 
                      valor={formCambio.destinoId} 
                      setValor={e => setFormCambio({...formCambio, destinoId: e.target.value})} 
                      opciones={getDestinosFiltrados()}
                    />
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cant. Resultante</label>
                    <input required type="number" min="1" value={formCambio.cantidadDestino} onChange={e => setFormCambio({...formCambio, cantidadDestino: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
                  </div>
                </div>
              </div>

            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors shadow-sm">Registrar Trasplante / Armado</button>
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
              <SelectorTrabajador valor={formDescargo.trabajadoresIds} setValor={values => setFormDescargo({...formDescargo, trabajadoresIds: values})} />
              
              <div className="md:col-span-2">
                <SelectorInventario label="Lote Afectado (Se restará stock)" valor={formDescargo.plantaPresentacionId} setValor={e => setFormDescargo({...formDescargo, plantaPresentacionId: e.target.value})} opciones={inventario.filter(i => i.stock > 0)} />
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
              <SelectorTrabajador valor={formEntrada.trabajadoresIds} setValor={values => setFormEntrada({...formEntrada, trabajadoresIds: values})} />
              
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


        {/* 5. CAMPO */}
        {tabActivo === 'campo' && (
          <form onSubmit={handleSubmitCampo} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2 flex space-x-6 border-b pb-4">
                <label className="flex items-center space-x-2 cursor-pointer text-lg font-medium">
                  <input type="radio" name="tipoCampo" value="Salida" checked={formCampo.tipo === 'Salida'} onChange={() => setFormCampo({...formCampo, tipo: 'Salida', plantaIdTemp: '', plantaPresentacionId: ''})} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                  <span>Sembrar a campo (Salida de Inv.)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-lg font-medium">
                  <input type="radio" name="tipoCampo" value="Entrada" checked={formCampo.tipo === 'Entrada'} onChange={() => setFormCampo({...formCampo, tipo: 'Entrada', plantaIdTemp: '', plantaPresentacionId: ''})} className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                  <span>Sacar de campo (Entrada a Inv.)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input required type="date" value={formCampo.fecha} onChange={e => setFormCampo({...formCampo, fecha: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
              <SelectorTrabajador valor={formCampo.trabajadoresIds} setValor={values => setFormCampo({...formCampo, trabajadoresIds: values})} />
              
              {formCampo.tipo === 'Salida' ? (
                <div className="md:col-span-2">
                  <SelectorInventario label="Selecciona Lote a Sembrar (Restará stock)" valor={formCampo.plantaPresentacionId} setValor={e => setFormCampo({...formCampo, plantaPresentacionId: e.target.value})} opciones={inventario.filter(i => i.stock > 0)} />
                </div>
              ) : (
                <div className="md:col-span-2 grid grid-cols-2 gap-4 border-l-4 border-blue-500 p-4 bg-blue-50/50 rounded-r-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1. Planta (Sacada de campo)</label>
                    <select required value={formCampo.plantaIdTemp} onChange={e => setFormCampo({...formCampo, plantaIdTemp: e.target.value, plantaPresentacionId: ''})} className="w-full border-gray-300 rounded-md p-2 border bg-white focus:ring-blue-500 text-sm">
                      <option value="">-- Seleccionar Planta --</option>
                      {plantasUnicas.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">2. Presentación a Ingresar</label>
                    <select required disabled={!formCampo.plantaIdTemp} value={formCampo.plantaPresentacionId} onChange={e => setFormCampo({...formCampo, plantaPresentacionId: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border bg-white focus:ring-blue-500 text-sm">
                      <option value="">-- Seleccionar Presentación --</option>
                      {getPresentacionesPorPlanta(formCampo.plantaIdTemp).map(i => (
                        <option key={i.id} value={i.id}>
                          [{i.codigo}] {i.presentacion?.nombre} (Stock actual: {i.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lugares (Viveros / Módulos)</label>
                <select multiple required value={formCampo.lugaresIds} onChange={e => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setFormCampo({...formCampo, lugaresIds: values});
                }} className="w-full border-gray-300 rounded-md p-2 border bg-white h-24 text-sm">
                  {origenes.map(o => <option key={o.id} value={o.id}>{o.codigo} - {o.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input required type="number" min="1" value={formCampo.cantidad} onChange={e => setFormCampo({...formCampo, cantidad: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
            </div>
            
            <button type="submit" className={`w-full font-bold py-3 rounded-md transition-colors shadow-sm text-white ${formCampo.tipo === 'Salida' ? 'bg-green-700 hover:bg-green-800' : 'bg-blue-600 hover:bg-blue-700'}`}>
              Registrar {formCampo.tipo === 'Salida' ? 'Siembra a Campo' : 'Extracción de Campo'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}