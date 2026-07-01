import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Eye, Pencil, Trash2, X, ClipboardList, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

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

  // --- ESTADOS PARA EL PANEL DE REGISTROS ---
  const [registrosRecientes, setRegistrosRecientes] = useState([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null); // registro seleccionado para ver detalle
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(null); // registro para confirmar eliminación
  const [eliminando, setEliminando] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Cargar registros cuando cambia la pestaña activa
  useEffect(() => {
    cargarRegistros();
  }, [tabActivo]);

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

  // --- CARGAR REGISTROS SEGÚN PESTAÑA ACTIVA ---
  const getEndpointForTab = (tab) => {
    switch (tab) {
      case 'produccion': return '/produccion';
      case 'cambio': return '/cambios-presentacion';
      case 'descargo': return '/descargos';
      case 'entrada': return '/entradas-exteriores';
      case 'campo': return '/campo';
      default: return '/produccion';
    }
  };

  const cargarRegistros = async () => {
    setCargandoRegistros(true);
    try {
      const endpoint = getEndpointForTab(tabActivo);
      const res = await api.get(endpoint);
      // Filtrar solo los del día de hoy y ordenar por id descendente
      const hoyStr = new Date().toISOString().split('T')[0];
      const sorted = (res.data || [])
        .filter(r => r.fecha === hoyStr)
        .sort((a, b) => (b.id || 0) - (a.id || 0));
      setRegistrosRecientes(sorted);
    } catch (error) {
      console.error("Error cargando registros", error);
      setRegistrosRecientes([]);
    } finally {
      setCargandoRegistros(false);
    }
  };

  // --- ELIMINAR REGISTRO ---
  const handleEliminar = async (registro) => {
    setEliminando(true);
    try {
      const endpoint = getEndpointForTab(tabActivo);
      await api.delete(`${endpoint}/${registro.id}`);
      toast.success("Registro eliminado. Inventario revertido.");
      setModalConfirmarEliminar(null);
      cargarRegistros();
      cargarCatalogos(); // Refrescar inventario
    } catch (error) {
      toast.error("Error al eliminar: " + (error.response?.data || error.message));
    } finally {
      setEliminando(false);
    }
  };

  // --- EDITAR REGISTRO ---
  useEffect(() => {
    if (location.state?.editRecord && location.state?.editTab) {
      setTabActivo(location.state.editTab);
      // Extraemos solo los ids de los trabajadores
      const recordToEdit = { ...location.state.editRecord };
      if (recordToEdit.trabajadores) {
        recordToEdit.trabajadoresIds = recordToEdit.trabajadores.map(t => t.id);
      }
      setModalEditar(recordToEdit);
      // Limpiar el state usando react-router para evitar crash
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setGuardandoEdicion(true);
    try {
      const endpoint = getEndpointForTab(tabActivo);
      
      let payload = { ...modalEditar };
      // Limpiar/ajustar relaciones complejas
      if (tabActivo === 'campo') {
        payload.trabajadorIds = modalEditar.trabajadoresIds || [];
        payload.lugarIds = modalEditar.lugares ? modalEditar.lugares.map(l => l.id) : [];
        if (modalEditar.plantaPresentacionId) {
            payload.plantaPresentacionId = modalEditar.plantaPresentacionId;
        } else if (modalEditar.plantaPresentacion) {
            payload.plantaPresentacionId = modalEditar.plantaPresentacion.id;
        }
      } else {
        payload.trabajadores = empleados.filter(emp => (modalEditar.trabajadoresIds || []).includes(emp.id));
        if (modalEditar.plantaPresentacion) {
            payload.plantaPresentacion = { id: modalEditar.plantaPresentacion.id };
        }
        if (tabActivo === 'cambio' && modalEditar.destino) {
            payload.destino = { id: modalEditar.destino.id };
        }
      }
      
      await api.put(`${endpoint}/${modalEditar.id}`, payload);
      toast.success("Registro actualizado correctamente.");
      setModalEditar(null);
      cargarRegistros();
    } catch (error) {
      toast.error("Error al actualizar: " + (error.response?.data || error.message));
    } finally {
      setGuardandoEdicion(false);
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
      cargarRegistros(); // Refrescar panel
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
      cargarRegistros();
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
      cargarRegistros();
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
      cargarRegistros();
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
      cargarRegistros();
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

  // --- HELPERS PARA EL PANEL DE REGISTROS ---
  const getNombrePlantaPresentacion = (pp) => {
    if (!pp) return 'N/A';
    const planta = pp.esArregloCombinado ? 'Arreglo Combinado' : (pp.planta?.nombre || '');
    const presentacion = pp.presentacion?.nombre || '';
    const codigo = pp.codigo || '';
    return `[${codigo}] ${planta} - ${presentacion}`;
  };

  const getTrabajadoresTexto = (trabajadores) => {
    if (!trabajadores || trabajadores.length === 0) return 'Sin trabajadores';
    return trabajadores.map(t => `${t.nombre || ''} ${t.apellido || ''}`).join(', ');
  };

  const getResumenRegistro = (registro) => {
    switch (tabActivo) {
      case 'produccion':
        return {
          titulo: getNombrePlantaPresentacion(registro.plantaPresentacion),
          subtitulo: `Cantidad: +${registro.cantidad}`,
          detalle: registro.siembraTiempoHoras ? `⏱ ${registro.siembraTiempoHoras}h` : '',
          color: 'green'
        };
      case 'cambio':
        return {
          titulo: `→ ${getNombrePlantaPresentacion(registro.destino)}`,
          subtitulo: `Resultado: +${registro.cantidadDestino}`,
          detalle: `${registro.detalles?.length || 0} origen(es)`,
          color: 'blue'
        };
      case 'descargo':
        return {
          titulo: getNombrePlantaPresentacion(registro.plantaPresentacion),
          subtitulo: `Cantidad: -${registro.cantidad}`,
          detalle: registro.motivoDescargo || '',
          color: 'red'
        };
      case 'entrada':
        return {
          titulo: getNombrePlantaPresentacion(registro.plantaPresentacion),
          subtitulo: `Cantidad: +${registro.cantidad} (${registro.tipo})`,
          detalle: registro.detalle || '',
          color: 'purple'
        };
      case 'campo':
        return {
          titulo: getNombrePlantaPresentacion(registro.plantaPresentacion),
          subtitulo: `Cantidad: ${registro.tipo === 'Salida' ? '-' : '+'}${registro.cantidad}`,
          detalle: `${registro.tipo} — ${registro.lugares?.map(l => l.nombre).join(', ') || ''}`,
          color: registro.tipo === 'Salida' ? 'amber' : 'teal'
        };
      default:
        return { titulo: '', subtitulo: '', detalle: '', color: 'gray' };
    }
  };

  const getColorClasses = (color) => ({
    card: `border-l-4 border-${color}-400`,
    badge: `bg-${color}-100 text-${color}-700`,
    header: `text-${color}-700`,
  });

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

  // --- COMPONENTE PANEL DE REGISTROS ---
  const PanelRegistros = () => {
    const tabNames = {
      produccion: 'Producción',
      cambio: 'Cambios de Presentación',
      descargo: 'Descargos',
      entrada: 'Entradas Exteriores',
      campo: 'Sembrado a Campo'
    };

    const tabColors = {
      produccion: 'green',
      cambio: 'blue',
      descargo: 'red',
      entrada: 'purple',
      campo: 'amber'
    };

    const color = tabColors[tabActivo] || 'gray';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
        {/* Header del panel */}
        <div className={`px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-${color}-50 to-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className={`w-5 h-5 text-${color}-600`} />
              <h3 className="font-bold text-gray-800 text-sm">Registros Recientes</h3>
            </div>
            <span className={`bg-${color}-100 text-${color}-700 text-xs font-bold px-2.5 py-1 rounded-full`}>
              {registrosRecientes.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{tabNames[tabActivo]}</p>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          {cargandoRegistros ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <span className="text-sm">Cargando registros...</span>
            </div>
          ) : registrosRecientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ClipboardList className="w-10 h-10 mb-3 opacity-40" />
              <span className="text-sm font-medium">Sin registros</span>
              <span className="text-xs mt-1">Los registros aparecerán aquí al crearlos</span>
            </div>
          ) : (
            registrosRecientes.map((registro) => {
              const resumen = getResumenRegistro(registro);
              return (
                <div
                  key={registro.id}
                  className={`bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-l-4 border-l-${resumen.color}-400`}
                >
                  {/* Info del registro */}
                  <div className="px-3.5 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono text-gray-400">#{registro.id}</span>
                      <span className="text-[11px] text-gray-500">{registro.fecha}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug truncate" title={resumen.titulo}>
                      {resumen.titulo}
                    </p>
                    <p className={`text-xs font-bold text-${resumen.color}-600 mt-0.5`}>
                      {resumen.subtitulo}
                    </p>
                    {resumen.detalle && (
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate" title={resumen.detalle}>
                        {resumen.detalle}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1 truncate">
                      👤 {getTrabajadoresTexto(registro.trabajadores)}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                    <button
                      onClick={() => setModalDetalle(registro)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </button>
                    <button
                      onClick={() => {
                        const rec = { ...registro };
                        if (rec.trabajadores) {
                          rec.trabajadoresIds = rec.trabajadores.map(t => t.id);
                        }
                        setModalEditar(rec);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => setModalConfirmarEliminar(registro)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // --- MODAL DE DETALLE ---
  const ModalDetalle = () => {
    if (!modalDetalle) return null;
    const reg = modalDetalle;
    
    // Función auxiliar para determinar el tipo y color
    const getTipoInfo = () => {
      switch (tabActivo) {
        case 'produccion': return { icon: '🌱', nombre: 'Producción', bg: 'bg-emerald-400' };
        case 'cambio': return { icon: '🔄', nombre: 'Cambio Presentación', bg: 'bg-sky-400' };
        case 'descargo': return { icon: '📉', nombre: 'Descargo', bg: 'bg-rose-400' };
        case 'entrada': return { icon: '📦', nombre: 'Entrada Exterior', bg: 'bg-violet-400' };
        case 'campo': return { icon: reg.tipo === 'Salida' ? '🌿' : '🔙', nombre: reg.tipo === 'Salida' ? 'Campo (Salida)' : 'Campo (Entrada)', bg: reg.tipo === 'Salida' ? 'bg-amber-400' : 'bg-teal-400' };
        default: return { icon: '📋', nombre: 'Operación', bg: 'bg-gray-400' };
      }
    };
    
    const info = getTipoInfo();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalDetalle(null)}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in" onClick={e => e.stopPropagation()}>
          <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                <span className="text-3xl drop-shadow-sm">{info.icon}</span>
                Detalle de Operación
              </h3>
              <p className="text-sm text-gray-500 font-mono mt-1 font-semibold ml-11">ID: {tabActivo.toUpperCase()}-{reg.id}</p>
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
                  <span className={`w-1.5 h-1.5 rounded-full ${info.bg}`}></span> Tipo
                </p>
                <p className="font-extrabold text-gray-800 text-lg">{info.nombre}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-50">
                <p className="text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Fecha Operación
                </p>
                <p className="font-extrabold text-gray-800 text-lg">{reg.fecha}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-50">
                <p className="text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Registro Sistema
                </p>
                <p className="font-bold text-gray-600 text-sm">{reg.createdAt ? new Date(reg.createdAt).toLocaleString() : 'N/A'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Por: {reg.createdBy || 'Sistema'}</p>
              </div>
            </div>

            {/* Campos dinámicos según el tipo de operación */}
            <div className="mb-8">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Datos Específicos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                
                {tabActivo === 'produccion' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Destino</span>
                      <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {getNombrePlantaPresentacion(reg.plantaPresentacion) || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad Producida</span>
                      <p className="text-xl text-emerald-600 font-black bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        +{reg.cantidad}
                      </p>
                    </div>
                    {reg.origenes?.length > 0 && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Módulos/Viveros Origen</span>
                        <div className="flex flex-wrap gap-2 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {reg.origenes.map(o => (
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
                        {reg.siembraTiempoHoras || '0'} Horas
                      </p>
                    </div>
                  </>
                )}

                {tabActivo === 'cambio' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Destino Resultante</span>
                      <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {getNombrePlantaPresentacion(reg.destino) || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad Destino</span>
                      <p className="text-xl text-sky-600 font-black bg-sky-50 p-3 rounded-xl border border-sky-100">
                        +{reg.cantidadDestino}
                      </p>
                    </div>
                    {reg.detalles?.length > 0 && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lotes Origen Utilizados (Restados)</span>
                        <div className="space-y-2 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {reg.detalles.map(d => (
                            <div key={d.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                              <span className="text-sm font-medium text-gray-700">{getNombrePlantaPresentacion(d.origen)}</span>
                              <span className="font-black text-rose-600 text-lg bg-rose-50 px-3 py-1 rounded-md">-{d.cantidadOrigen}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {tabActivo === 'descargo' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Afectado</span>
                      <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {getNombrePlantaPresentacion(reg.plantaPresentacion) || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad de Baja</span>
                      <p className="text-xl text-rose-600 font-black bg-rose-50 p-3 rounded-xl border border-rose-100">
                        -{reg.cantidad}
                      </p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Motivo del Descargo</span>
                      <p className="text-base text-gray-800 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                        "{reg.motivoDescargo}"
                      </p>
                    </div>
                  </>
                )}

                {tabActivo === 'entrada' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tipo de Entrada</span>
                      <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100 capitalize">
                        {reg.tipo}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad Ingresada</span>
                      <p className="text-xl text-violet-600 font-black bg-violet-50 p-3 rounded-xl border border-violet-100">
                        +{reg.cantidad}
                      </p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Destino</span>
                      <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {getNombrePlantaPresentacion(reg.plantaPresentacion) || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Detalle / Proveedor</span>
                      <p className="text-base text-gray-800 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {reg.detalle}
                      </p>
                    </div>
                    {reg.totalPrecio != null && (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Costo Total</span>
                        <p className="text-xl text-emerald-700 font-black bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          ${reg.totalPrecio.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {tabActivo === 'campo' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Acción de Campo</span>
                      <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {reg.tipo === 'Salida' ? 'Sembrar a campo (Salida de Inv.)' : 'Sacar de campo (Entrada a Inv.)'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad</span>
                      <p className={`text-xl font-black p-3 rounded-xl border ${reg.tipo === 'Salida' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-teal-600 bg-teal-50 border-teal-100'}`}>
                        {reg.tipo === 'Salida' ? '-' : '+'}{reg.cantidad}
                      </p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Lote Asociado</span>
                      <p className="text-base text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {getNombrePlantaPresentacion(reg.plantaPresentacion) || 'N/A'}
                      </p>
                    </div>
                    {reg.lugares?.length > 0 && (
                      <div className="space-y-1 md:col-span-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Ubicaciones en Campo</span>
                        <div className="flex flex-wrap gap-2 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {reg.lugares.map(l => (
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
            {reg.trabajadores?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Personal Asignado</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {reg.trabajadores.map(t => (
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

          <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button
              onClick={() => {
                setModalDetalle(null);
                setModalConfirmarEliminar(reg);
              }}
              className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" /> Eliminar
            </button>
            <button
              onClick={() => {
                setModalDetalle(null);
                setModalEditar(reg);
              }}
              className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Pencil className="w-5 h-5" /> Editar
            </button>
            <button
              onClick={() => setModalDetalle(null)}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-all shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ---
  const ModalConfirmarEliminar = () => {
    if (!modalConfirmarEliminar) return null;
    const reg = modalConfirmarEliminar;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !eliminando && setModalConfirmarEliminar(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-5 text-center">
            <div className="w-14 h-14 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar registro #{reg.id}?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Esta acción eliminará el registro y <span className="font-semibold text-red-600">revertirá los cambios de inventario</span> asociados. No se puede deshacer.
            </p>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              disabled={eliminando}
              onClick={() => setModalConfirmarEliminar(null)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              disabled={eliminando}
              onClick={() => handleEliminar(reg)}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {eliminando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {eliminando ? 'Eliminando...' : 'Sí, Eliminar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      
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

      {/* Layout: Formulario + Panel de Registros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Formulario */}
        <div className="lg:col-span-7">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            
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

        {/* Columna Derecha: Panel de Registros */}
        <div className="lg:col-span-5">
          <PanelRegistros />
        </div>
      </div>

      {/* Modales */}
      <ModalDetalle />
      <ModalConfirmarEliminar />
      
      {/* Modal de Edición Avanzada */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in overflow-hidden">
            <div className="px-8 py-5 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black text-amber-900 flex items-center gap-3">
                  <Pencil className="w-6 h-6 text-amber-500" />
                  Editar Operación
                </h3>
                <p className="text-sm text-gray-500 font-mono mt-1 font-semibold ml-9">ID: {tabActivo.toUpperCase()}-{modalEditar.id}</p>
              </div>
              <button onClick={() => setModalEditar(null)} className="p-2.5 bg-white hover:bg-red-50 hover:text-red-600 rounded-xl transition-all shadow-sm border border-gray-200 group">
                <X className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-gray-50/30 flex-1">
              <form id="editForm" onSubmit={handleGuardarEdicion} className="space-y-6">
                
                {/* Fila 1: Fecha y Trabajadores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Fecha de Operación</label>
                    <input 
                      type="date" 
                      required 
                      value={modalEditar.fecha || ''} 
                      onChange={e => setModalEditar({...modalEditar, fecha: e.target.value})} 
                      className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 font-medium" 
                    />
                  </div>
                  <div>
                    <SelectorTrabajador 
                      valor={modalEditar.trabajadoresIds || []} 
                      setValor={values => setModalEditar({...modalEditar, trabajadoresIds: values})} 
                    />
                  </div>
                </div>

                {/* Datos Específicos de la Operación */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Datos Modificables de Inventario</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {tabActivo === 'produccion' && (
                      <>
                        <div className="md:col-span-2">
                          <SelectorInventario 
                            label="Lote de Destino (Planta Presentación)" 
                            valor={modalEditar.plantaPresentacionId || modalEditar.plantaPresentacion?.id} 
                            setValor={e => setModalEditar({...modalEditar, plantaPresentacionId: parseInt(e.target.value)})} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Cantidad Producida</label>
                          <input 
                            type="number" min="1" required
                            value={modalEditar.cantidad || ''} 
                            onChange={e => setModalEditar({...modalEditar, cantidad: parseInt(e.target.value)})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-emerald-50 text-emerald-700 font-bold" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tiempo (Horas)</label>
                          <input 
                            type="number" step="0.5" min="0" required
                            value={modalEditar.siembraTiempoHoras || ''} 
                            onChange={e => setModalEditar({...modalEditar, siembraTiempoHoras: parseFloat(e.target.value)})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-gray-50 font-medium" 
                          />
                        </div>
                        <div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-2">
                          <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Nota: Para modificar los Módulos/Viveros de Origen, elimine la operación y regístrela nuevamente.
                          </p>
                        </div>
                      </>
                    )}

                    {tabActivo === 'cambio' && (
                      <>
                        <div className="md:col-span-2">
                          <SelectorInventario 
                            label="Nuevo Destino (Presentación Final)" 
                            valor={modalEditar.destino?.id} 
                            setValor={e => setModalEditar({...modalEditar, destino: { id: parseInt(e.target.value) }})} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Cantidad Destino Resultante</label>
                          <input 
                            type="number" min="1" required
                            value={modalEditar.cantidadDestino || ''} 
                            onChange={e => setModalEditar({...modalEditar, cantidadDestino: parseInt(e.target.value)})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-sky-50 text-sky-700 font-bold" 
                          />
                        </div>
                        <div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-2">
                          <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Nota: Para modificar los Lotes Origen utilizados, elimine este Cambio de Presentación y regístrelo nuevamente.
                          </p>
                        </div>
                      </>
                    )}

                    {tabActivo === 'descargo' && (
                      <>
                        <div className="md:col-span-2">
                          <SelectorInventario 
                            label="Lote Afectado" 
                            valor={modalEditar.plantaPresentacionId || modalEditar.plantaPresentacion?.id} 
                            setValor={e => setModalEditar({...modalEditar, plantaPresentacionId: parseInt(e.target.value)})} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Cantidad Dada de Baja</label>
                          <input 
                            type="number" min="1" required
                            value={modalEditar.cantidad || ''} 
                            onChange={e => setModalEditar({...modalEditar, cantidad: parseInt(e.target.value)})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-rose-50 text-rose-700 font-bold" 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Motivo del Descargo</label>
                          <textarea 
                            required rows="3" 
                            value={modalEditar.motivoDescargo || ''} 
                            onChange={e => setModalEditar({...modalEditar, motivoDescargo: e.target.value})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-gray-50 font-medium" 
                          ></textarea>
                        </div>
                      </>
                    )}

                    {tabActivo === 'entrada' && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tipo de Entrada</label>
                          <select 
                            value={modalEditar.tipo || ''} 
                            onChange={e => setModalEditar({...modalEditar, tipo: e.target.value})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-gray-50 font-medium capitalize"
                          >
                            <option value="Compra">Compra</option>
                            <option value="Donación">Donación</option>
                            <option value="Ajuste">Ajuste de Inventario</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Cantidad Ingresada</label>
                          <input 
                            type="number" min="1" required
                            value={modalEditar.cantidad || ''} 
                            onChange={e => setModalEditar({...modalEditar, cantidad: parseInt(e.target.value)})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-violet-50 text-violet-700 font-bold" 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <SelectorInventario 
                            label="Lote Destino" 
                            valor={modalEditar.plantaPresentacionId || modalEditar.plantaPresentacion?.id} 
                            setValor={e => setModalEditar({...modalEditar, plantaPresentacionId: parseInt(e.target.value)})} 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Detalle / Proveedor</label>
                          <input 
                            type="text" required 
                            value={modalEditar.detalle || ''} 
                            onChange={e => setModalEditar({...modalEditar, detalle: e.target.value})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-gray-50 font-medium" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Costo Total ($) (Opcional)</label>
                          <input 
                            type="number" step="0.01" min="0" 
                            value={modalEditar.totalPrecio || ''} 
                            onChange={e => setModalEditar({...modalEditar, totalPrecio: parseFloat(e.target.value)})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-emerald-50 text-emerald-700 font-bold" 
                          />
                        </div>
                      </>
                    )}

                    {tabActivo === 'campo' && (
                      <>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Acción de Campo</label>
                          <select 
                            value={modalEditar.tipo || ''} 
                            onChange={e => setModalEditar({...modalEditar, tipo: e.target.value})} 
                            className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-gray-50 font-medium"
                          >
                            <option value="Salida">Sembrar a campo (Resta de Inventario)</option>
                            <option value="Entrada">Sacar de campo (Suma a Inventario)</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <SelectorInventario 
                            label="Lote Asociado" 
                            valor={modalEditar.plantaPresentacionId || modalEditar.plantaPresentacion?.id} 
                            setValor={e => setModalEditar({...modalEditar, plantaPresentacionId: parseInt(e.target.value)})} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Cantidad</label>
                          <input 
                            type="number" min="1" required
                            value={modalEditar.cantidad || ''} 
                            onChange={e => setModalEditar({...modalEditar, cantidad: parseInt(e.target.value)})} 
                            className={`w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 font-bold ${modalEditar.tipo === 'Salida' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'}`} 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Ubicaciones en Campo</label>
                          <select multiple value={modalEditar.lugares?.map(l => l.id) || []} onChange={e => {
                            const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                            const lugaresNuevos = origenes.filter(o => values.includes(o.id));
                            setModalEditar({...modalEditar, lugares: lugaresNuevos});
                          }} className="w-full border-gray-300 rounded-xl p-3 border focus:ring-2 focus:ring-amber-500 bg-gray-50 font-medium h-32">
                            {origenes.map(o => <option key={o.id} value={o.id}>{o.codigo} - {o.nombre}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                  </div>
                </div>

              </form>
            </div>
            
            <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setModalEditar(null)} 
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="editForm"
                disabled={guardandoEdicion}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-md flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {guardandoEdicion ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando...</>
                ) : (
                  <><Pencil className="w-5 h-5 mr-2" /> Guardar Cambios</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}