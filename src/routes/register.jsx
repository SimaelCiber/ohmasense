import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardBody, Input, Button, Link as HeroLink } from '@heroui/react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'

function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signUp(email, password, fullName)
      if (error) throw error
      setSuccess(true)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardBody className="p-8 text-center">
              <h1 className="text-3xl font-bold mb-4 text-success">¡Registro Exitoso!</h1>
              <p className="mb-6">
                Por favor verifica tu email para confirmar tu cuenta.
              </p>
              <Button as={Link} to="/login" color="primary">
                Ir a Iniciar Sesión
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardBody className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Registrarse</h1>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
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
                minLength={6}
              />
              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={loading}
              >
                Registrarse
              </Button>
            </form>
            <p className="text-center mt-4">
              ¿Ya tienes cuenta?{' '}
              <HeroLink as={Link} to="/login">
                Inicia sesión aquí
              </HeroLink>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})
