import { createFileRoute, Link } from '@tanstack/react-router'
import { Button, Card, CardBody } from '@heroui/react'

function IndexPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">Bienvenido a OhmaSense</h1>
        <p className="text-xl text-gray-600 mb-8">
          Descubre nuestra exclusiva colección de perfumes
        </p>
        <Button as={Link} to="/catalog" color="primary" size="lg">
          Ver Catálogo
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardBody className="text-center p-6">
            <div className="text-4xl mb-4">🌸</div>
            <h3 className="text-xl font-semibold mb-2">Marcas Premium</h3>
            <p className="text-gray-600">Las mejores fragancias del mundo</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center p-6">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-semibold mb-2">Calidad Garantizada</h3>
            <p className="text-gray-600">Productos 100% originales</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center p-6">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">Envío Seguro</h3>
            <p className="text-gray-600">Entrega garantizada</p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: IndexPage,
})
