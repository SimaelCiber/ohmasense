import { Link } from '@tanstack/react-router'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge } from '@heroui/react'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'

export const AppNavbar = () => {
  const { user, profile, signOut, isStaff } = useAuth()
  const { itemCount } = useCart()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <Navbar isBordered>
      <NavbarBrand>
        <Link to="/" className="font-bold text-inherit">
          OhmaSense
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link to="/catalog" className="text-foreground">
            Catálogo
          </Link>
        </NavbarItem>
        {user && (
          <NavbarItem>
            <Link to="/orders" className="text-foreground">
              Mis Pedidos
            </Link>
          </NavbarItem>
        )}
        {isStaff && (
          <NavbarItem>
            <Link to="/admin" className="text-foreground">
              Admin
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Link to="/cart">
            <Badge content={itemCount} color="primary" showOutline={false}>
              <Button variant="light">
                🛒 Carrito
              </Button>
            </Badge>
          </Link>
        </NavbarItem>
        {user ? (
          <Dropdown>
            <NavbarItem>
              <DropdownTrigger>
                <Button variant="flat">
                  {profile?.full_name || user.email}
                </Button>
              </DropdownTrigger>
            </NavbarItem>
            <DropdownMenu aria-label="User Actions">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Sesión iniciada como</p>
                <p className="font-semibold">{user.email}</p>
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onClick={handleSignOut}>
                Cerrar Sesión
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem className="hidden lg:flex">
              <Link to="/login">Iniciar Sesión</Link>
            </NavbarItem>
            <NavbarItem>
              <Button as={Link} to="/register" color="primary" variant="flat">
                Registrarse
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </Navbar>
  )
}
