import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardBody, Input, Button, Link as HeroLink } from '@heroui/react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      navigate({ to: '/' })
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardBody className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Iniciar Sesión</h1>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={loading}
              >
                Iniciar Sesión
              </Button>
            </form>
            <p className="text-center mt-4">
              ¿No tienes cuenta?{' '}
              <HeroLink as={Link} to="/register">
                Regístrate aquí
              </HeroLink>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
