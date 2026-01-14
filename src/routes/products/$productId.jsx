import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardBody, Image, Button, Spinner, RadioGroup, Radio, Chip } from '@heroui/react'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/utils'
import { useCart } from '../../hooks/useCart'

function ProductDetailPage() {
  const { productId } = Route.useParams()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*),
          product_images(*)
        `)
        .eq('id', productId)
        .single()

      if (error) throw error
      
      data.product_images.sort((a, b) => a.display_order - b.display_order)
      data.product_variants.sort((a, b) => a.size_ml - b.size_ml)
      
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

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl">Producto no encontrado</h1>
      </div>
    )
  }

  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert('Por favor selecciona un tamaño')
      return
    }

    const variant = product.product_variants.find(v => v.id === selectedVariant)
    if (!variant) return

    addToCart({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      variantLabel: `${variant.size_ml}ml`,
      price: variant.price,
      quantity: quantity,
      image: product.product_images[0]?.image_url || ''
    })

    alert('¡Producto agregado al carrito!')
  }

  const currentVariant = product.product_variants.find(v => v.id === selectedVariant)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="mb-4">
            <Image
              src={product.product_images[selectedImage]?.image_url || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
          {product.product_images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.product_images.map((img, idx) => (
                <Image
                  key={img.id}
                  src={img.image_url}
                  alt={`${product.name} - ${idx + 1}`}
                  className={`w-20 h-20 object-cover cursor-pointer rounded ${
                    selectedImage === idx ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedImage(idx)}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <Chip color="primary" variant="flat" className="mb-2">{product.brand}</Chip>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>

          <Card className="mb-6">
            <CardBody>
              <RadioGroup
                label="Selecciona el tamaño"
                value={selectedVariant}
                onValueChange={setSelectedVariant}
              >
                {product.product_variants.map(variant => (
                  <Radio key={variant.id} value={variant.id}>
                    <div className="flex justify-between w-full">
                      <span>{variant.size_ml}ml</span>
                      <span className="font-bold">{formatPrice(variant.price)}</span>
                      {variant.stock > 0 ? (
                        <span className="text-success text-sm">En stock: {variant.stock}</span>
                      ) : (
                        <span className="text-danger text-sm">Agotado</span>
                      )}
                    </div>
                  </Radio>
                ))}
              </RadioGroup>
            </CardBody>
          </Card>

          {currentVariant && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Cantidad</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <input
                  type="number"
                  min="1"
                  max={currentVariant.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center border rounded px-2"
                />
                <Button
                  size="sm"
                  onClick={() => setQuantity(Math.min(currentVariant.stock, quantity + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              color="primary"
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              isDisabled={!selectedVariant || currentVariant?.stock === 0}
            >
              Agregar al Carrito
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/products/$productId')({
  component: ProductDetailPage,
})
