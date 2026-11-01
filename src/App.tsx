import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { RotaProtegida, RotaPublica } from '@/auth/RotaProtegida'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuditoriasPage } from '@/pages/auditorias/AuditoriasPage'
import { NovaAuditoriaPage } from '@/pages/auditorias/NovaAuditoriaPage'
import { ResponderAuditoriaPage } from '@/pages/auditorias/ResponderAuditoriaPage'
import { ClienteFormPage } from '@/pages/clientes/ClienteFormPage'
import { ClientesPage } from '@/pages/clientes/ClientesPage'
import { ContaPage } from '@/pages/conta/ContaPage'
import { CriarContaPage } from '@/pages/criar-conta/CriarContaPage'
import { EntrarPage } from '@/pages/entrar/EntrarPage'
import { NaoEncontradaPage } from '@/pages/nao-encontrada/NaoEncontradaPage'

const router = createBrowserRouter([
  {
    element: <RotaPublica />,
    children: [
      { path: '/entrar', element: <EntrarPage /> },
      { path: '/criar-conta', element: <CriarContaPage /> },
    ],
  },
  {
    element: <RotaProtegida />,
    children: [
      { path: '/', element: <Navigate to="/auditorias" replace /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/auditorias', element: <AuditoriasPage />, handle: { titulo: 'Auditorias' } },
          {
            path: '/auditorias/nova',
            element: <NovaAuditoriaPage />,
            handle: { titulo: 'Nova auditoria', voltar: '/auditorias' },
          },
          {
            path: '/auditorias/:id/responder',
            element: <ResponderAuditoriaPage />,
            handle: { titulo: 'Responder auditoria', voltar: '/auditorias' },
          },
          { path: '/clientes', element: <ClientesPage />, handle: { titulo: 'Clientes' } },
          {
            path: '/clientes/novo',
            element: <ClienteFormPage />,
            handle: { titulo: 'Novo cliente', voltar: '/clientes' },
          },
          {
            path: '/clientes/:id',
            element: <ClienteFormPage />,
            handle: { titulo: 'Editar cliente', voltar: '/clientes' },
          },
          { path: '/conta', element: <ContaPage />, handle: { titulo: 'Conta' } },
        ],
      },
    ],
  },
  { path: '*', element: <NaoEncontradaPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
