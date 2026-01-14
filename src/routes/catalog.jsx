import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardBody, CardFooter, Image, Input, Select, SelectItem, Spinner, Button } from '@heroui/react'
import { Link } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../lib/utils'

function CatalogPage() {
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*),
          product_images(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand))]
    return uniqueBrands.sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                           product.brand.toLowerCase().includes(search.toLowerCase())
      const matchesBrand = !brandFilter || product.brand === brandFilter
      
      const minVariantPrice = Math.min(...product.product_variants.map(v => v.price))
      const matchesPrice = (!minPrice || minVariantPrice >= parseFloat(minPrice)) &&
                          (!maxPrice || minVariantPrice <= parseFloat(maxPrice))

      return matchesSearch && matchesBrand && matchesPrice
    })
  }, [products, search, brandFilter, minPrice, maxPrice])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Catálogo de Perfumes</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Input
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          label="Búsqueda"
        />
        <Select
          placeholder="Todas las marcas"
          label="Marca"
          selectedKeys={brandFilter ? [brandFilter] : []}
          onChange={(e) => setBrandFilter(e.target.value)}
        >
          <SelectItem key="" value="">Todas las marcas</SelectItem>
          {brands.map(brand => (
            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
          ))}
        </Select>
        <Input
          type="number"
          placeholder="Precio mínimo"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          label="Precio mínimo"
          startContent="$"
        />
        <Input
          type="number"
          placeholder="Precio máximo"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          label="Precio máximo"
          startContent="$"
        />
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const firstImage = product.product_images[0]?.image_url || 'https://via.placeholder.com/300'
          const minPrice = Math.min(...product.product_variants.map(v => v.price))

          return (
            <Card key={product.id} isPressable as={Link} to={`/products/${product.id}`}>
              <CardBody className="p-0">
                <Image
                  src={firstImage}
                  alt={product.name}
                  className="w-full object-cover h-64"
                />
              </CardBody>
              <CardFooter className="flex-col items-start">
                <p className="text-xs text-gray-500 uppercase">{product.brand}</p>
                <h4 className="font-semibold text-lg">{product.name}</h4>
                <p className="text-primary font-bold">Desde {formatPrice(minPrice)}</p>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron productos</p>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/catalog')({
  component: CatalogPage,
})
