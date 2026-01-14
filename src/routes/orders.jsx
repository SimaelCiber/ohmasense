import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner, Button } from '@heroui/react'
import { Link } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatPrice, formatDate } from '../lib/utils'

function OrdersPage() {
  const { user } = useAuth()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Pagado'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Mis Pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No tienes pedidos aún</p>
          <Button as={Link} to="/catalog" color="primary">
            Ver Catálogo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} isPressable as={Link} to={`/orders/${order.id}`}>
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                    {order.note && (
                      <p className="text-sm mt-2 text-gray-600">Nota: {order.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Chip color={getStatusColor(order.status)} variant="flat">
                      {getStatusText(order.status)}
                    </Chip>
                    <p className="text-xl font-bold mt-2">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
})
