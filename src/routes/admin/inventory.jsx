import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Spinner
} from '@heroui/react'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'

function AdminInventoryPage() {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          product_variants(
            size_ml,
            products(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data
    },
  })

  const getMovementColor = (type) => {
    switch (type) {
      case 'in': return 'success'
      case 'out': return 'danger'
      case 'adjustment': return 'warning'
      default: return 'default'
    }
  }

  const getMovementText = (type) => {
    switch (type) {
      case 'in': return 'Entrada'
      case 'out': return 'Salida'
      case 'adjustment': return 'Ajuste'
      default: return type
    }
  }

  return (
    <ProtectedRoute requireStaff>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Movimientos de Inventario</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table aria-label="Movimientos de Inventario">
            <TableHeader>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>PRODUCTO</TableColumn>
              <TableColumn>VARIANTE</TableColumn>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>CANTIDAD</TableColumn>
              <TableColumn>RAZÓN</TableColumn>
            </TableHeader>
            <TableBody>
              {movements.map(movement => (
                <TableRow key={movement.id}>
                  <TableCell>{formatDate(movement.created_at)}</TableCell>
                  <TableCell>{movement.product_variants?.products?.name}</TableCell>
                  <TableCell>{movement.product_variants?.size_ml}ml</TableCell>
                  <TableCell>
                    <Chip color={getMovementColor(movement.movement_type)} variant="flat">
                      {getMovementText(movement.movement_type)}
                    </Chip>
                  </TableCell>
                  <TableCell>{movement.quantity}</TableCell>
                  <TableCell>{movement.reason || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/admin/inventory')({
  component: AdminInventoryPage,
})
