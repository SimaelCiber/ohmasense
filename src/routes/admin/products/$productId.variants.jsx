import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Card, CardBody, CardHeader,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Spinner, useDisclosure
} from '@heroui/react'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { supabase } from '../../../lib/supabase'
import { formatPrice } from '../../../lib/utils'

function ProductVariantsPage() {
  const { productId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingVariant, setEditingVariant] = useState(null)
  const [formData, setFormData] = useState({
    size_ml: 50,
    price: 0,
    stock: 0
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

  const { data: variants = [], isLoading: loadingVariants } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('size_ml')

      if (error) throw error
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (variantData) => {
      const { data, error } = await supabase
        .from('product_variants')
        .insert({ ...variantData, product_id: productId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-variants', productId])
      onClose()
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...variantData }) => {
      const { data, error } = await supabase
        .from('product_variants')
        .update(variantData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-variants', productId])
      onClose()
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-variants', productId])
    },
  })

  const resetForm = () => {
    setFormData({
      size_ml: 50,
      price: 0,
      stock: 0
    })
    setEditingVariant(null)
  }

  const handleOpen = (variant = null) => {
    if (variant) {
      setEditingVariant(variant)
      setFormData({
        size_ml: variant.size_ml,
        price: variant.price,
        stock: variant.stock
      })
    } else {
      resetForm()
    }
    onOpen()
  }

  const handleSubmit = () => {
    if (editingVariant) {
      updateMutation.mutate({ id: editingVariant.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar esta variante?')) {
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
            <h1 className="text-3xl font-bold">Variantes de {product?.name}</h1>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600">Marca: {product?.brand}</p>
          </CardBody>
        </Card>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Tamaños y Precios</h2>
          <Button color="primary" onClick={() => handleOpen()}>
            + Nueva Variante
          </Button>
        </div>

        {loadingVariants ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table aria-label="Variantes">
            <TableHeader>
              <TableColumn>TAMAÑO (ML)</TableColumn>
              <TableColumn>PRECIO</TableColumn>
              <TableColumn>STOCK</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {variants.map(variant => (
                <TableRow key={variant.id}>
                  <TableCell>{variant.size_ml}ml</TableCell>
                  <TableCell>{formatPrice(variant.price)}</TableCell>
                  <TableCell>{variant.stock}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleOpen(variant)}>
                        Editar
                      </Button>
                      <Button size="sm" color="danger" onClick={() => handleDelete(variant.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>
              {editingVariant ? 'Editar Variante' : 'Nueva Variante'}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  type="number"
                  label="Tamaño (ml)"
                  value={formData.size_ml}
                  onChange={(e) => setFormData({ ...formData, size_ml: parseInt(e.target.value) })}
                  required
                />
                <Input
                  type="number"
                  label="Precio"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  startContent="$"
                  required
                />
                <Input
                  type="number"
                  label="Stock"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  required
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                color="primary" 
                onClick={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingVariant ? 'Actualizar' : 'Crear'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/admin/products/$productId/variants')({
  component: ProductVariantsPage,
})
