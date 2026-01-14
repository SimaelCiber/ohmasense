import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardBody, Chip, Spinner, Button, Divider } from '@heroui/react'
import { supabase } from '../../lib/supabase'
import { formatPrice, formatDate } from '../../lib/utils'

function OrderDetailPage() {
  const { orderId } = Route.useParams()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl">Pedido no encontrado</h1>
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

  const shareOnWhatsApp = () => {
    const message = `
*Ticket de Compra - OhmaSense*

Pedido: #${order.id.slice(0, 8)}
Fecha: ${formatDate(order.created_at)}
Estado: ${getStatusText(order.status)}

*Productos:*
${order.order_items.map(item => `• ${item.product_name} (${item.variant_label}) x${item.quantity} - ${formatPrice(item.price * item.quantity)}`).join('\n')}

*Total: ${formatPrice(order.total_amount)}*

${order.note ? `Nota: ${order.note}` : ''}

¡Gracias por tu compra!
    `.trim()

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardBody className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold">Ticket de Compra</h1>
                <p className="text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
                <p className="text-gray-500">{formatDate(order.created_at)}</p>
              </div>
              <Chip color={getStatusColor(order.status)} size="lg">
                {getStatusText(order.status)}
              </Chip>
            </div>

            <Divider className="my-4" />

            <div className="mb-6">
              <h2 className="font-semibold mb-2">Información del Cliente</h2>
              <p>{order.customer_name}</p>
              <p>{order.customer_email}</p>
              {order.customer_whatsapp && <p>WhatsApp: {order.customer_whatsapp}</p>}
            </div>

            <Divider className="my-4" />

            <div className="mb-6">
              <h2 className="font-semibold mb-4">Productos</h2>
              <div className="space-y-3">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">{item.variant_label} x{item.quantity}</p>
                    </div>
                    <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {order.note && (
              <>
                <Divider className="my-4" />
                <div className="mb-6">
                  <h2 className="font-semibold mb-2">Nota</h2>
                  <p className="text-gray-600">{order.note}</p>
                </div>
              </>
            )}

            <Divider className="my-4" />

            <div className="flex justify-between text-2xl font-bold mb-6">
              <span>Total:</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>

            <Button
              color="success"
              className="w-full"
              size="lg"
              onClick={shareOnWhatsApp}
            >
              📱 Compartir por WhatsApp
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/orders/$orderId')({
  component: OrderDetailPage,
})
