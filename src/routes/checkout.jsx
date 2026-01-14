import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardBody, Button, Input, Textarea, Spinner } from '@heroui/react'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { formatPrice } from '../lib/utils'
import { supabase } from '../lib/supabase'

function CheckoutPage() {
  const { cart, total, clearCart } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: profile?.full_name || '',
    customerWhatsapp: '',
    note: ''
  })

  if (cart.length === 0) {
    navigate({ to: '/cart' })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert('Debes iniciar sesión para completar la compra')
      navigate({ to: '/login' })
      return
    }

    setLoading(true)

    try {
      const orderData = {
        user_id: user.id,
        customer_email: user.email,
        customer_name: formData.customerName,
        customer_whatsapp: formData.customerWhatsapp,
        total_amount: total,
        status: 'pending',
        note: formData.note
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId,
        product_name: item.productName,
        variant_label: item.variantLabel,
        price: item.price,
        quantity: item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          items: cart,
          customerEmail: user.email
        }),
      })

      const { sessionId } = await response.json()

      const { error: updateError } = await supabase
        .from('orders')
        .update({ stripe_checkout_session_id: sessionId })
        .eq('id', order.id)

      if (updateError) throw updateError

      const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })

      if (stripeError) throw stripeError

      clearCart()
    } catch (error) {
      console.error('Error al procesar el pago:', error)
      alert('Error al procesar el pago. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Debes iniciar sesión</h1>
        <Button onClick={() => navigate({ to: '/login' })} color="primary">
          Iniciar Sesión
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Información de Contacto</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nombre completo"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
                <Input
                  label="WhatsApp (con código de país)"
                  placeholder="+52 123 456 7890"
                  value={formData.customerWhatsapp}
                  onChange={(e) => setFormData({ ...formData, customerWhatsapp: e.target.value })}
                  required
                />
                <Textarea
                  label="Notas adicionales (opcional)"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full"
                  isLoading={loading}
                >
                  {loading ? <Spinner size="sm" /> : 'Proceder al Pago con Stripe'}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Resumen del Pedido</h2>
              <div className="space-y-2 mb-4">
                {cart.map(item => (
                  <div key={item.variantId} className="flex justify-between">
                    <span>{item.productName} ({item.variantLabel}) x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-4" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})
