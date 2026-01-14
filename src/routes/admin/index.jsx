import { createFileRoute } from '@tanstack/react-router'
import { Card, CardBody } from '@heroui/react'
import { Link } from '@tanstack/react-router'
import { ProtectedRoute } from '../../components/ProtectedRoute'

function AdminDashboard() {
  return (
    <ProtectedRoute requireStaff>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Panel de Administración</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card isPressable as={Link} to="/admin/products">
            <CardBody className="text-center p-8">
              <div className="text-5xl mb-4">📦</div>
              <h2 className="text-2xl font-bold">Productos</h2>
              <p className="text-gray-600">Gestionar productos</p>
            </CardBody>
          </Card>

          <Card isPressable as={Link} to="/admin/orders">
            <CardBody className="text-center p-8">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-2xl font-bold">Pedidos</h2>
              <p className="text-gray-600">Ver todos los pedidos</p>
            </CardBody>
          </Card>

          <Card isPressable as={Link} to="/admin/inventory">
            <CardBody className="text-center p-8">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-2xl font-bold">Inventario</h2>
              <p className="text-gray-600">Movimientos de stock</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})
