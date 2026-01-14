import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppNavbar } from '../components/AppNavbar'
import { AppFooter } from '../components/AppFooter'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col">
      <AppNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  ),
})
