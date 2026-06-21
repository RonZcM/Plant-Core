import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function CatalogoVisor() {
  const [plantas, setPlantas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Modal State
  const [plantaSeleccionada, setPlantaSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resPlantas, resInv] = await Promise.all([
        api.get('/plantas'),
        api.get('/planta-presentacion')
      ]);
      
      const plantasData = resPlantas.data;
      // Añadir "Arreglo Combinado" como una planta especial
      plantasData.push({
        id: 'arreglo',
        nombre: 'Arreglo Combinado',
        nombreCientifico: 'Compositae variabilis',
        codigo: 'ARR',
        imagen: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
      });
      
      setPlantas(plantasData);
      setInventario(resInv.data);
    } catch (error) {
      console.error("Error cargando catálogo:", error);
    } finally {
      setCargando(false);
    }
  };

  const getPresentaciones = (plantaId) => {
    if (plantaId === 'arreglo') {
      return inventario.filter(i => i.esArregloCombinado);
    }
    return inventario.filter(i => i.planta && String(i.planta.id) === String(plantaId));
  };

  const getTotalStock = (plantaId) => {
    const presentaciones = getPresentaciones(plantaId);
    return presentaciones.reduce((sum, item) => sum + item.stock, 0);
  };

  const placeholderImg = "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
  
  const getImageUrl = (url) => {
    if (!url) return placeholderImg;
    if (url.startsWith('/fotos/')) {
      return `http://localhost:8080${url}`;
    }
    return url;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header / Hero */}
      <div className="bg-white p-10 rounded-2xl shadow-sm text-center relative overflow-hidden border border-gray-100">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-50 to-transparent z-0"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-green-800 mb-3 tracking-tight">Descubre la Naturaleza</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Explora nuestro catálogo completo de plantas. Conoce la disponibilidad de stock, variaciones y combinaciones en inventario.
          </p>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-gray-500 text-lg">Cargando catálogo visual...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {plantas.map((planta) => {
            const stockTotal = getTotalStock(planta.id);
            return (
              <article 
                key={planta.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 relative group cursor-pointer"
                onClick={() => setPlantaSeleccionada(planta)}
              >
                {stockTotal > 0 && (
                  <span className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 text-xs font-bold rounded-full z-10 shadow-sm">
                    Stock: {stockTotal}
                  </span>
                )}
                {stockTotal === 0 && (
                  <span className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-full z-10 shadow-sm">
                    Sin Stock
                  </span>
                )}

                <div className="w-full h-56 overflow-hidden bg-gray-100">
                  <img 
                    src={getImageUrl(planta.imagen)} 
                    alt={planta.nombre}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.target.src = placeholderImg }}
                  />
                </div>
                
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{planta.nombre}</h3>
                  <p className="text-sm text-gray-500 italic mb-4 h-5 overflow-hidden">
                    {planta.nombreCientifico || "Sin nombre científico"}
                  </p>
                  
                  <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      ID: {planta.codigo}
                    </span>
                    <button className="text-green-700 font-bold text-sm hover:text-green-800 transition-colors">
                      Ver Detalles &rarr;
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal de Detalles */}
      {plantaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row animate-fadeIn">
            
            <div className="md:w-2/5 h-64 md:h-auto relative bg-gray-100">
              <img 
                src={getImageUrl(plantaSeleccionada.imagen)} 
                alt={plantaSeleccionada.nombre}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { e.target.src = placeholderImg }}
              />
            </div>
            
            <div className="md:w-3/5 p-8 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-800">{plantaSeleccionada.nombre}</h2>
                  <p className="text-green-700 font-medium italic">{plantaSeleccionada.nombreCientifico}</p>
                </div>
                <button 
                  onClick={() => setPlantaSeleccionada(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="mb-6">
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold mr-2">
                  Código: {plantaSeleccionada.codigo}
                </span>
                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Stock Total: {getTotalStock(plantaSeleccionada.id)}
                </span>
              </div>

              <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">Vínculos de Inventario Disponibles</h4>
              
              <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
                {getPresentaciones(plantaSeleccionada.id).length === 0 ? (
                  <p className="text-gray-500 italic py-4">No hay vínculos registrados en inventario para esta planta.</p>
                ) : (
                  getPresentaciones(plantaSeleccionada.id).map(p => (
                    <div key={p.id} className="bg-gray-50 border border-gray-100 p-4 rounded-lg flex justify-between items-center hover:bg-green-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">
                          [{p.codigo}] {p.presentacion?.nombre}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {p.detalle && <span>{p.detalle} </span>}
                          {p.tamanio && <span>de {p.tamanio}</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock > 0 ? 'bg-green-200 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {p.stock} unid.
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
