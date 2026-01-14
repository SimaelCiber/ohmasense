import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Textarea, Switch, Spinner, useDisclosure
} from '@heroui/react'
import { Link } from '@tanstack/react-router'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/utils'

function AdminProductsPage() {
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    base_price: 0,
    is_active: true
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (productData) => {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
      onClose()
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...productData }) => {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
      onClose()
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      brand: '',
      base_price: 0,
      is_active: true
    })
    setEditingProduct(null)
  }

  const handleOpen = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        brand: product.brand,
        base_price: product.base_price,
        is_active: product.is_active
      })
    } else {
      resetForm()
    }
    onOpen()
  }

  const handleSubmit = () => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <ProtectedRoute requireStaff>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Gestión de Productos</h1>
          <Button color="primary" onClick={() => handleOpen()}>
            + Nuevo Producto
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table aria-label="Productos">
            <TableHeader>
              <TableColumn>NOMBRE</TableColumn>
              <TableColumn>MARCA</TableColumn>
              <TableColumn>PRECIO BASE</TableColumn>
              <TableColumn>ACTIVO</TableColumn>
              <TableColumn>VARIANTES</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {products.map(product => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>{formatPrice(product.base_price)}</TableCell>
                  <TableCell>{product.is_active ? '✅' : '❌'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" as={Link} to={`/admin/products/${product.id}/variants`}>
                        Variantes
                      </Button>
                      <Button size="sm" as={Link} to={`/admin/products/${product.id}/images`}>
                        Imágenes
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleOpen(product)}>
                        Editar
                      </Button>
                      <Button size="sm" color="danger" onClick={() => handleDelete(product.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalContent>
            <ModalHeader>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Marca"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
                <Textarea
                  label="Descripción"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Input
                  type="number"
                  label="Precio Base"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                  startContent="$"
                />
                <Switch
                  isSelected={formData.is_active}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                >
                  Producto Activo
                </Switch>
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
                {editingProduct ? 'Actualizar' : 'Crear'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/admin/products')({
  component: AdminProductsPage,
})
