import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Pages — a implementar por el equipo
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/Users.jsx'
import Orders from './pages/Orders.jsx'
import Products from './pages/Products.jsx'

/**
 * Componente raíz de la aplicación. Define el enrutador principal con todas
 * las rutas del backoffice, incluyendo la redirección por defecto hacia el dashboard.
 *
 * @returns {JSX.Element} Componente renderizado con el árbol de rutas de la aplicación.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/products" element={<Products />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
