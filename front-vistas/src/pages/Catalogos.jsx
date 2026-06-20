import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Catalogos() {
  const [tabActivo, setTabActivo] = useState('plantas');
  
  const [plantas, setPlantas] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);

  // Estados Presentación (CRUD + Filtro)
  const [busquedaPresentacion, setBusquedaPresentacion] = useState('');
  const [modoEdicionPresentacion, setModoEdicionPresentacion] = useState(false);
  const [idPresentacionActual, setIdPresentacionActual] = useState(null);
  const [nuevaPresentacion, setNuevaPresentacion] = useState({ codigo: '', nombre: '', cc: '', requisicion: '', createdBy: 'Admin' });

  // Estados Planta (CRUD + Filtro + Imagen)
  const [busquedaPlanta, setBusquedaPlanta] = useState('');
  const [modoEdicionPlanta, setModoEdicionPlanta] = useState(false);
  const [idPlantaActual, setIdPlantaActual] = useState(null);
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [imagenRemovida, setImagenRemovida] = useState(false);
  const [nuevaPlanta, setNuevaPlanta] = useState({ codigo: '', nombre: '', nombreCientifico: '', createdBy: 'Admin' });

  // Estados Origen (CRUD + Filtro)
  const [origenes, setOrigenes] = useState([]);
  const [busquedaOrigen, setBusquedaOrigen] = useState('');
  const [modoEdicionOrigen, setModoEdicionOrigen] = useState(false);
  const [idOrigenActual, setIdOrigenActual] = useState(null);
  const [nuevoOrigen, setNuevoOrigen] = useState({ codigo: '', nombre: '', createdBy: 'Admin' });

  // Estados Vínculos
  const [vinculos, setVinculos] = useState([]);
  const [nuevoVinculo, setNuevoVinculo] = useState({ 
    plantaId: '', 
    presentacionId: '',
    codigo: '',
    detalle: '',
    tamanio: ''
  });

  useEffect(() => {
    cargarPlantas();
    cargarPresentaciones();
    cargarOrigenes();
    cargarVinculos();
  }, []);


  const cargarVinculos = async () => {
    try {
      const res = await api.get('/planta-presentacion');
      setVinculos(res.data);
    } catch (error) { console.error("Error cargando vínculos", error); }
  };

  const cargarPlantas = async () => {
    try {
      const res = await api.get('/plantas');
      setPlantas(res.data);
    } catch (error) { console.error("Error cargando plantas", error); }
  };

  const cargarPresentaciones = async () => {
    try {
      const res = await api.get('/presentaciones');
      setPresentaciones(res.data);
    } catch (error) { console.error("Error cargando presentaciones", error); }
  };

  const cargarOrigenes = async () => {
    try {
      const res = await api.get('/origenes');
      setOrigenes(res.data);
    } catch (error) { console.error("Error cargando orígenes", error); }
  };

  // --- LÓGICA CRUD ORÍGENES ---
  const handleSubmitOrigen = async (e) => {
    e.preventDefault();

    if (!nuevoOrigen.codigo.trim() || !nuevoOrigen.nombre.trim()) {
      alert("El código y el nombre son obligatorios.");
      return;
    }

    try {
      const payload = {
        codigo: nuevoOrigen.codigo.trim(),
        nombre: nuevoOrigen.nombre.trim(),
        createdBy: nuevoOrigen.createdBy
      };

      if (modoEdicionOrigen) {
        await api.put(`/origenes/${idOrigenActual}`, payload);
      } else {
        await api.post('/origenes', payload);
      }

      cancelarEdicionOrigen();
      cargarOrigenes();
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data);
      } else {
        alert("Error al guardar origen.");
      }
    }
  };

  const editarOrigen = (ori) => {
    setModoEdicionOrigen(true);
    setIdOrigenActual(ori.id);
    setNuevoOrigen({ codigo: ori.codigo, nombre: ori.nombre, createdBy: ori.createdBy || 'Admin' });
  };

  const eliminarOrigen = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este origen?")) {
      try {
        await api.delete(`/origenes/${id}`);
        cargarOrigenes();
      } catch (error) { alert("Error al eliminar origen."); }
    }
  };

  const cancelarEdicionOrigen = () => {
    setModoEdicionOrigen(false);
    setIdOrigenActual(null);
    setNuevoOrigen({ codigo: '', nombre: '', createdBy: 'Admin' });
  };

  const origenesFiltrados = origenes.filter(o => 
    o.nombre.toLowerCase().includes(busquedaOrigen.toLowerCase()) || 
    o.codigo.toLowerCase().includes(busquedaOrigen.toLowerCase())
  );

  // --- LÓGICA CRUD VÍNCULOS (INVENTARIO) ---
  const handleSubmitVinculo = async (e) => {
    e.preventDefault();

    if (!nuevoVinculo.plantaId || !nuevoVinculo.presentacionId || !nuevoVinculo.codigo.trim()) {
      alert("La planta, presentación y código son obligatorios.");
      return;
    }

    try {
      await api.post('/planta-presentacion', {
        planta: { id: nuevoVinculo.plantaId },
        presentacion: { id: nuevoVinculo.presentacionId },
        codigo: nuevoVinculo.codigo.trim(),
        detalle: nuevoVinculo.detalle,
        tamanio: nuevoVinculo.tamanio,
        stock: 0,
        createdBy: 'Admin'
      });
      setNuevoVinculo({ plantaId: '', presentacionId: '', codigo: '', detalle: '', tamanio: '' });
      cargarVinculos();
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data);
      } else {
        alert("Error al crear el vínculo.");
      }
    }
  };

  const eliminarVinculo = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este vínculo del catálogo?")) {
      try {
        await api.delete(`/planta-presentacion/${id}`);
        cargarVinculos();
      } catch (error) {
        if (error.response && error.response.data) {
          alert(error.response.data); // Muestra el error de stock > 0
        } else {
          alert("Error al eliminar el vínculo.");
        }
      }
    }
  };

  // --- LÓGICA CRUD PLANTAS ---

const handleSubmitPlanta = async (e) => {
    e.preventDefault();

    // 1. Validación Frontend: Evitar espacios en blanco
    if (!nuevaPlanta.codigo.trim() || !nuevaPlanta.nombre.trim()) {
      alert("El código y el nombre son obligatorios y no pueden estar vacíos.");
      return;
    }

    try {
      let idPlantaGuardada;

      if (modoEdicionPlanta) {
        // UPDATE
        await api.put(`/plantas/${idPlantaActual}?removerImagen=${imagenRemovida}`, {
          ...nuevaPlanta,
          codigo: nuevaPlanta.codigo.trim(), // Limpiamos espacios basura antes de enviar
          nombre: nuevaPlanta.nombre.trim()
        });
        idPlantaGuardada = idPlantaActual;
      } else {
        // CREATE
        const res = await api.post('/plantas', {
          ...nuevaPlanta,
          codigo: nuevaPlanta.codigo.trim(),
          nombre: nuevaPlanta.nombre.trim()
        });
        idPlantaGuardada = res.data.id;
      }

      // Subir nueva imagen si seleccionó una
      if (archivoImagen) {
        const formData = new FormData();
        formData.append('file', archivoImagen);
        await api.post(`/plantas/${idPlantaGuardada}/imagen`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      cancelarEdicionPlanta();
      cargarPlantas();
    } catch (error) { 
      // 2. Validación Backend: Mostrar el mensaje que manda Spring Boot
      if (error.response && error.response.data) {
        alert(error.response.data); // Muestra: "El código 'X' ya está registrado..."
      } else {
        alert("Error al guardar la planta. Verifica la conexión.");
      }
    }
  };

  const editarPlanta = (planta) => {
    setModoEdicionPlanta(true);
    setIdPlantaActual(planta.id);
    setNuevaPlanta({ codigo: planta.codigo, nombre: planta.nombre, nombreCientifico: planta.nombreCientifico || '', createdBy: planta.createdBy || 'Admin' });
    setArchivoImagen(null);
    setImagenRemovida(false); // Reiniciamos el estado
    setPreviewImagen(planta.imagen ? `http://localhost:8080${planta.imagen}` : null);
  };

  const eliminarPlanta = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta planta?")) {
      try {
        await api.delete(`/plantas/${id}`);
        cargarPlantas();
      } catch (error) { alert("Error al eliminar (Puede que tenga inventario asociado)"); }
    }
  };

 const cancelarEdicionPlanta = () => {
    setModoEdicionPlanta(false);
    setIdPlantaActual(null);
    setNuevaPlanta({ codigo: '', nombre: '', nombreCientifico: '', createdBy: 'Admin' });
    setArchivoImagen(null);
    setPreviewImagen(null);
    setImagenRemovida(false); // Reiniciamos el estado
    document.getElementById('inputFotoPlanta').value = ''; // Limpiamos el input file visualmente
  };

  // Filtro
  const plantasFiltradas = plantas.filter(p => 
    p.nombre.toLowerCase().includes(busquedaPlanta.toLowerCase()) || 
    p.codigo.toLowerCase().includes(busquedaPlanta.toLowerCase())
  );

  // --- LÓGICA CRUD PRESENTACIONES ---
  const handleSubmitPresentacion = async (e) => {
    e.preventDefault();

    if (!nuevaPresentacion.codigo.trim() || !nuevaPresentacion.nombre.trim() || nuevaPresentacion.cc === '' || nuevaPresentacion.requisicion === '') {
      alert("Todos los campos son obligatorios.");
      return;
    }

    try {
      const payload = {
        ...nuevaPresentacion,
        codigo: nuevaPresentacion.codigo.trim(),
        nombre: nuevaPresentacion.nombre.trim(),
        cc: Number(nuevaPresentacion.cc),
        requisicion: Number(nuevaPresentacion.requisicion)
      };

      if (modoEdicionPresentacion) {
        await api.put(`/presentaciones/${idPresentacionActual}`, payload);
      } else {
        await api.post('/presentaciones', payload);
      }

      cancelarEdicionPresentacion();
      cargarPresentaciones();
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data);
      } else {
        alert("Error al guardar presentación.");
      }
    }
  };

  const editarPresentacion = (pres) => {
    setModoEdicionPresentacion(true);
    setIdPresentacionActual(pres.id);
    setNuevaPresentacion({ codigo: pres.codigo, nombre: pres.nombre, cc: pres.cc, requisicion: pres.requisicion, createdBy: pres.createdBy || 'Admin' });
  };

  const eliminarPresentacion = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta presentación?")) {
      try {
        await api.delete(`/presentaciones/${id}`);
        cargarPresentaciones();
      } catch (error) { alert("Error al eliminar (Puede que tenga inventario asociado)"); }
    }
  };

  const cancelarEdicionPresentacion = () => {
    setModoEdicionPresentacion(false);
    setIdPresentacionActual(null);
    setNuevaPresentacion({ codigo: '', nombre: '', cc: '', requisicion: '', createdBy: 'Admin' });
  };

  const presentacionesFiltradas = presentaciones.filter(p => 
    p.nombre.toLowerCase().includes(busquedaPresentacion.toLowerCase()) || 
    p.codigo.toLowerCase().includes(busquedaPresentacion.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-extrabold text-gray-800">Catálogos del Sistema</h2>
        <p className="text-sm text-gray-500 mt-1">Administración de especies, recipientes y vínculos de inventario.</p>
      </div>

      <div className="flex border-b border-gray-200">
        {['plantas', 'presentaciones', 'origenes', 'vinculos'].map((tab) => (
          <button
            key={tab}
            onClick={() => setTabActivo(tab)}
            className={`py-3 px-6 font-medium text-sm capitalize transition-colors duration-200 ${
              tabActivo === tab ? 'border-b-2 border-green-600 text-green-700 bg-green-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'vinculos' ? 'Planta-Presentación' : tab}
          </button>
        ))}
      </div>

      {/* --- PESTAÑA PLANTAS --- */}
      {tabActivo === 'plantas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modoEdicionPlanta ? 'Editar Planta' : 'Nueva Planta'}</h3>
            <form onSubmit={handleSubmitPlanta} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input required type="text" value={nuevaPlanta.codigo} onChange={e => setNuevaPlanta({...nuevaPlanta, codigo: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Común</label>
                <input required type="text" value={nuevaPlanta.nombre} onChange={e => setNuevaPlanta({...nuevaPlanta, nombre: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Científico</label>
                <input type="text" value={nuevaPlanta.nombreCientifico} onChange={e => setNuevaPlanta({...nuevaPlanta, nombreCientifico: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fotografía</label>
                
                {previewImagen && (
                  <div className="mb-3 relative w-32 h-32 rounded-lg border-2 border-dashed border-green-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img src={previewImagen} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { 
                        setArchivoImagen(null); 
                        setPreviewImagen(null); 
                        setImagenRemovida(true); // Le avisamos al sistema que la quitó
                        document.getElementById('inputFotoPlanta').value = ''; // Limpiamos el texto del archivo
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow-md"
                    >
                      X
                    </button>
                  </div>
                )}

                <input 
                  id="inputFotoPlanta"
                  type="file" 
                  accept="image/*" 
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setArchivoImagen(file);
                      setPreviewImagen(URL.createObjectURL(file));
                      setImagenRemovida(false); // Si sube otra, ya no cuenta como removida
                    }
                  }} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" 
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-md transition-colors">
                  {modoEdicionPlanta ? 'Actualizar' : 'Guardar'}
                </button>
                {modoEdicionPlanta && (
                  <button type="button" onClick={cancelarEdicionPlanta} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-md transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tabla y Filtro */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col h-[600px]">
            {/* Barra de Búsqueda */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <input 
                type="text" 
                placeholder="Buscar por nombre o código..." 
                value={busquedaPlanta}
                onChange={e => setBusquedaPlanta(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Img</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plantasFiltradas.length > 0 ? plantasFiltradas.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        {p.imagen ? (
                          <img src={`http://localhost:8080${p.imagen}`} alt={p.nombre} className="h-10 w-10 rounded-full object-cover border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                        )}
                      </td>
                      <td className="px-6 py-3 font-mono text-sm">{p.codigo}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-gray-900">{p.nombre}</div>
                        <div className="text-xs text-gray-500 italic">{p.nombreCientifico}</div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => editarPlanta(p)} className="text-blue-600 hover:text-blue-900 mx-2 text-sm font-medium">Editar</button>
                        <button onClick={() => eliminarPlanta(p.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Borrar</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center py-8 text-gray-500">No se encontraron plantas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO: PESTAÑA PRESENTACIONES */}
      {tabActivo === 'presentaciones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario Presentación */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modoEdicionPresentacion ? 'Editar Presentación' : 'Nueva Presentación'}</h3>
            <form onSubmit={handleSubmitPresentacion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código / Ref</label>
                <input required type="text" value={nuevaPresentacion.codigo} onChange={e => setNuevaPresentacion({...nuevaPresentacion, codigo: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500 focus:border-green-500" placeholder="Ej: PC#1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Envase</label>
                <input required type="text" value={nuevaPresentacion.nombre} onChange={e => setNuevaPresentacion({...nuevaPresentacion, nombre: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500 focus:border-green-500" placeholder="Ej: Maceta, Bolsa 12x14" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sustrato (cc)</label>
                  <input required type="number" min="0" value={nuevaPresentacion.cc} onChange={e => setNuevaPresentacion({...nuevaPresentacion, cc: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requisición</label>
                  <input required type="number" min="0" value={nuevaPresentacion.requisicion} onChange={e => setNuevaPresentacion({...nuevaPresentacion, requisicion: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500 focus:border-green-500" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-md transition-colors">
                  {modoEdicionPresentacion ? 'Actualizar' : 'Guardar'}
                </button>
                {modoEdicionPresentacion && (
                  <button type="button" onClick={cancelarEdicionPresentacion} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-md transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tabla y Filtro Presentaciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col h-[600px]">
            {/* Barra de Búsqueda */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <input 
                type="text" 
                placeholder="Buscar por nombre o código..." 
                value={busquedaPresentacion}
                onChange={e => setBusquedaPresentacion(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">CC</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Req.</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {presentacionesFiltradas.length > 0 ? presentacionesFiltradas.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-sm">{p.codigo}</td>
                      <td className="px-6 py-3 text-sm font-medium">{p.nombre}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-600">{p.cc}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-600">{p.requisicion}</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => editarPresentacion(p)} className="text-blue-600 hover:text-blue-900 mx-2 text-sm font-medium">Editar</button>
                        <button onClick={() => eliminarPresentacion(p.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Borrar</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No se encontraron presentaciones.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO: PESTAÑA ORÍGENES */}
      {tabActivo === 'origenes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario Origen */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modoEdicionOrigen ? 'Editar Origen' : 'Nuevo Origen'}</h3>
            <form onSubmit={handleSubmitOrigen} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input required type="text" value={nuevoOrigen.codigo} onChange={e => setNuevoOrigen({...nuevoOrigen, codigo: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500 focus:border-green-500" placeholder="Ej: VI-80" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Descripción</label>
                <input required type="text" value={nuevoOrigen.nombre} onChange={e => setNuevoOrigen({...nuevoOrigen, nombre: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500 focus:border-green-500" placeholder="Ej: Vivero 80%..." />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-md transition-colors">
                  {modoEdicionOrigen ? 'Actualizar' : 'Guardar'}
                </button>
                {modoEdicionOrigen && (
                  <button type="button" onClick={cancelarEdicionOrigen} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-md transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tabla y Filtro Orígenes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <input 
                type="text" 
                placeholder="Buscar por nombre o código..." 
                value={busquedaOrigen}
                onChange={e => setBusquedaOrigen(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nombre / Descripción</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {origenesFiltrados.length > 0 ? origenesFiltrados.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-sm">{o.codigo}</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{o.nombre}</td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => editarOrigen(o)} className="text-blue-600 hover:text-blue-900 mx-2 text-sm font-medium">Editar</button>
                        <button onClick={() => eliminarOrigen(o.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Borrar</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="text-center py-8 text-gray-500">No se encontraron orígenes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO: PESTAÑA VÍNCULOS */}
      {tabActivo === 'vinculos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario Vínculo */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Vincular al Inventario</h3>
            <form onSubmit={handleSubmitVinculo} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cód. Inventario</label>
                <input required type="text" value={nuevoVinculo.codigo} onChange={e => setNuevoVinculo({...nuevoVinculo, codigo: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500" placeholder="Ej: PQCA01001" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planta</label>
                <select required value={nuevoVinculo.plantaId} onChange={e => setNuevoVinculo({...nuevoVinculo, plantaId: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border bg-white">
                  <option value="">-- Elige --</option>
                  {plantas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presentación</label>
                <select required value={nuevoVinculo.presentacionId} onChange={e => setNuevoVinculo({...nuevoVinculo, presentacionId: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border bg-white">
                  <option value="">-- Elige --</option>
                  {presentaciones.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                  <input type="text" value={nuevoVinculo.tamanio} onChange={e => setNuevoVinculo({...nuevoVinculo, tamanio: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500" placeholder="Ej: 8 pulgadas" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detalle</label>
                  <textarea rows="2" value={nuevoVinculo.detalle} onChange={e => setNuevoVinculo({...nuevoVinculo, detalle: e.target.value})} className="w-full border-gray-300 rounded-md p-2 border focus:ring-green-500" placeholder="Info. complementaria"></textarea>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-md transition-colors shadow-sm">
                  Crear Vínculo
                </button>
              </div>
            </form>
          </div>

          {/* Tabla Vínculos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col h-[600px]">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cód. Inv.</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Planta / Pres.</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Especificaciones</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vinculos.length > 0 ? vinculos.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-sm font-bold text-gray-800">{v.codigo}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-gray-900">{v.planta?.nombre}</div>
                        <div className="text-xs text-gray-500">{v.presentacion?.nombre}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-sm text-gray-700">Tam: {v.tamanio || 'N/A'}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[150px]">{v.detalle}</div>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-green-700">
                        {v.stock}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => eliminarVinculo(v.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Borrar</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center py-10 text-gray-500">No hay vínculos creados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}