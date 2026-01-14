import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Card, CardBody, CardHeader,
  Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Spinner, useDisclosure, Image
} from '@heroui/react'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { supabase } from '../../../lib/supabase'

function ProductImagesPage() {
  const { productId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [formData, setFormData] = useState({
    image_url: '',
    display_order: 0
  })

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      return data
    },
  })

  const { data: images = [], isLoading: loadingImages } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order')

      if (error) throw error
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (imageData) => {
      const { data, error } = await supabase
        .from('product_images')
        .insert({ ...imageData, product_id: productId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-images', productId])
      onClose()
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-images', productId])
    },
  })

  const resetForm = () => {
    setFormData({
      image_url: '',
      display_order: images.length
    })
  }

  const handleSubmit = () => {
    createMutation.mutate(formData)
  }

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar esta imagen?')) {
      deleteMutation.mutate(id)
    }
  }

  if (loadingProduct) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <ProtectedRoute requireStaff>
      <div className="container mx-auto px-4 py-8">
        <Button onClick={() => navigate({ to: '/admin/products' })} variant="light" className="mb-4">
          ← Volver a Productos
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <h1 className="text-3xl font-bold">Galería de {product?.name}</h1>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600">Marca: {product?.brand}</p>
          </CardBody>
        </Card>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Imágenes</h2>
          <Button color="primary" onClick={onOpen}>
            + Agregar Imagen
          </Button>
        </div>

        {loadingImages ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image, index) => (
              <Card key={image.id}>
                <CardBody className="p-0">
                  <Image
                    src={image.image_url}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-64 object-cover"
                  />
                </CardBody>
                <CardBody>
                  <p className="text-sm text-gray-500">Orden: {image.display_order}</p>
                  <Button 
                    size="sm" 
                    color="danger" 
                    className="mt-2 w-full"
                    onClick={() => handleDelete(image.id)}
                  >
                    Eliminar
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {images.length === 0 && !loadingImages && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay imágenes aún</p>
          </div>
        )}

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Agregar Imagen</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="URL de la imagen"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  label="Orden de visualización"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
                {formData.image_url && (
                  <div>
                    <p className="text-sm mb-2">Vista previa:</p>
                    <Image
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                color="primary" 
                onClick={handleSubmit}
                isLoading={createMutation.isPending}
                isDisabled={!formData.image_url}
              >
                Agregar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/admin/products/$productId/images')({
  component: ProductImagesPage,
})
