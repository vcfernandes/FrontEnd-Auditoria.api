import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { RotaProtegida, RotaPublica } from '@/auth/RotaProtegida'
import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/sonner'
import { AuditoriasPage } from '@/pages/auditorias/AuditoriasPage'
import { EditorModeloPage } from '@/pages/auditorias/modelos/editor/EditorModeloPage'
import { NovaAuditoriaPage } from '@/pages/auditorias/NovaAuditoriaPage'
import { ResponderAuditoriaPage } from '@/pages/auditorias/responder/ResponderAuditoriaPage'
import { ResultadoAuditoriaPage } from '@/pages/auditorias/resultado/ResultadoAuditoriaPage'
import { InicioPage } from '@/pages/inicio/InicioPage'
import { ClienteFormPage } from '@/pages/clientes/ClienteFormPage'
import { ClientesPage } from '@/pages/clientes/ClientesPage'
import { ContaPage } from '@/pages/conta/ContaPage'
import { ConfiraEmailPage } from '@/pages/criar-conta/ConfiraEmailPage'
import { CriarContaPage } from '@/pages/criar-conta/CriarContaPage'
import { EntrarPage } from '@/pages/entrar/EntrarPage'
import { EsqueciSenhaPage } from '@/pages/esqueci-senha/EsqueciSenhaPage'
import { NaoEncontradaPage } from '@/pages/nao-encontrada/NaoEncontradaPage'
import { RedefinirSenhaPage } from '@/pages/redefinir-senha/RedefinirSenhaPage'
import { VerificarEmailPage } from '@/pages/verificar-email/VerificarEmailPage'
import { AvisoAtualizacao } from '@/pwa/AvisoAtualizacao'

const router = createBrowserRouter([
  {
    element: <RotaPublica />,
    children: [
      { path: '/entrar', element: <EntrarPage /> },
      { path: '/criar-conta', element: <CriarContaPage /> },
      { path: '/confira-email', element: <ConfiraEmailPage /> },
      { path: '/esqueci-senha', element: <EsqueciSenhaPage /> },
    ],
  },
  // Links dos e-mails: abrem mesmo com sessão ativa (fora de RotaPublica), senão o token se perderia no redirecionamento.
  { path: '/verificar-email', element: <VerificarEmailPage /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },
  {
    element: <RotaProtegida />,
    children: [
      { path: '/', element: <Navigate to="/inicio" replace /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/inicio', element: <InicioPage />, handle: { titulo: 'Início', larga: true } },
          { path: '/auditorias', element: <AuditoriasPage />, handle: { titulo: 'Auditorias', larga: true } },
          {
            path: '/auditorias/nova',
            element: <NovaAuditoriaPage />,
            handle: { titulo: 'Nova auditoria', voltar: '/auditorias' },
          },
          {
            path: '/auditorias/modelos/novo',
            element: <EditorModeloPage />,
            handle: { titulo: 'Novo modelo', voltar: '/auditorias', larga: true },
          },
          {
            path: '/auditorias/modelos/:id/editar',
            element: <EditorModeloPage />,
            handle: { titulo: 'Editar modelo', voltar: '/auditorias', larga: true },
          },
          {
            path: '/auditorias/:id/responder',
            element: <ResponderAuditoriaPage />,
            handle: { titulo: 'Responder auditoria', voltar: '/auditorias' },
          },
          {
            path: '/auditorias/:id/resultado',
            element: <ResultadoAuditoriaPage />,
            handle: { titulo: 'Resultado', voltar: '/auditorias' },
          },
          { path: '/clientes', element: <ClientesPage />, handle: { titulo: 'Clientes', larga: true } },
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
  return (
    <>
      <RouterProvider router={router} />
      <AvisoAtualizacao />
      <Toaster position="top-center" richColors closeButton />
    </>
  )
}
