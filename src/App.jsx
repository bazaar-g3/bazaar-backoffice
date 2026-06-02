import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/Users.jsx'
import Orders from './pages/Orders.jsx'
import Products from './pages/Products.jsx'
import Metrics from './pages/Metrics.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users"     element={<Users />} />
                  <Route path="/orders"    element={<Orders />} />
                  <Route path="/products"  element={<Products />} />
                  <Route path="/metrics"  element={<Metrics />} />
                  <Route path="/"          element={<Navigate to="/dashboard" replace />} />
                  <Route path="*"          element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
