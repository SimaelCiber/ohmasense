import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Card, CardBody, Button, Image, Input } from '@heroui/react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../lib/utils'

function CartPage() {
  const { cart, total, removeFromCart, updateQuantity } = useCart()
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-6">Agrega productos para comenzar tu compra</p>
        <Button as={Link} to="/catalog" color="primary">
          Ver Catálogo
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Carrito de Compras</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {cart.map(item => (
            <Card key={item.variantId} className="mb-4">
              <CardBody>
                <div className="flex gap-4">
                  <Image
                    src={item.image || 'https://via.placeholder.com/100'}
                    alt={item.productName}
                    className="w-24 h-24 object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.productName}</h3>
                    <p className="text-gray-600">{item.variantLabel}</p>
                    <p className="text-primary font-bold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex gap-2 items-center">
                      <Button
                        size="sm"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.variantId, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                        size="sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      color="danger"
                      variant="flat"
                      size="sm"
                      onClick={() => removeFromCart(item.variantId)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Resumen del Pedido</h2>
              <div className="space-y-2 mb-4">
                {cart.map(item => (
                  <div key={item.variantId} className="flex justify-between text-sm">
                    <span>{item.productName} ({item.variantLabel}) x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-4" />
              <div className="flex justify-between text-xl font-bold mb-6">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Button
                color="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate({ to: '/checkout' })}
              >
                Proceder al Pago
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/cart')({
  component: CartPage,
})
