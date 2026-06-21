import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Inventario from './pages/Inventario';
import Catalogos from './pages/Catalogos';
import Operaciones from './pages/Operaciones';
import logoCaposa from './assets/CAPOSA-LOGO.png';
import Empleados from './pages/Empleados';
import Dashboard from './pages/Dashboard';
import CatalogoVisor from './pages/CatalogoVisor';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100 font-sans">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        {/* Sidebar */}
        <aside className="w-64 bg-green-800 text-white flex flex-col shadow-lg z-10 shrink-0">
          
          {/* Logo y Encabezado */}
          <div className="p-6 border-b border-green-700 flex flex-col items-center text-center">
            <div className="bg-black/45 p-2 rounded-xl mb-3 shadow-sm backdrop-blur-sm">
              <img 
                src={logoCaposa} 
                alt="CAPOSA S.A. de C.V." 
                className="w-32 h-auto drop-shadow-md object-contain"
              />
            </div>
            <h1 className="text-xl font-bold tracking-widest text-green-50">PLANT-CORE</h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-6">
            <Link to="/" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-green-700 hover:pl-6">
              Bitácora General
            </Link>
            <Link to="/inventario" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-green-700 hover:pl-6">
              Inventario
            </Link>
            <Link to="/operaciones" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-green-700 hover:pl-6">
              Operaciones Diarias
            </Link>
            <Link to="/catalogo-visual" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-green-700 hover:pl-6">
              Ver Catálogo
            </Link>
            
            {/* SEPARADOR Y NUEVO ENLACE */}
            <div className="pt-4 mt-4 border-t border-green-700">
              <p className="px-4 text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Administración</p>
              <Link to="/catalogos" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-green-700 hover:pl-6">
                Gestión de Catálogos
              </Link>
              <Link to="/empleados" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-green-700 hover:pl-6">
                Personal
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/operaciones" element={<Operaciones />} /> 
            <Route path="/catalogo-visual" element={<CatalogoVisor />} />
            <Route path="/catalogos" element={<Catalogos />} />
            <Route path="/empleados" element={<Empleados />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;