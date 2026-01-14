import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Spinner
} from '@heroui/react'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { supabase } from '../../lib/supabase'
import { formatPrice, formatDate } from '../../lib/utils'

function AdminOrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Pagado'
      case 'pending': return 'Pendiente'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  return (
    <ProtectedRoute requireStaff>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Gestión de Pedidos</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table aria-label="Pedidos">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>TOTAL</TableColumn>
              <TableColumn>ESTADO</TableColumn>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div>
                      <p>{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>{formatPrice(order.total_amount)}</TableCell>
                  <TableCell>
                    <Chip color={getStatusColor(order.status)} variant="flat">
                      {getStatusText(order.status)}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/admin/orders')({
  component: AdminOrdersPage,
})
