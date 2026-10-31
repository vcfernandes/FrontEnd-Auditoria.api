import { createBrowserRouter, RouterProvider } from 'react-router'
import { RotaProtegida, RotaPublica } from '@/auth/RotaProtegida'
import { CriarContaPage } from '@/pages/criar-conta/CriarContaPage'
import { EntrarPage } from '@/pages/entrar/EntrarPage'
import { InicioPage } from '@/pages/inicio/InicioPage'
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
    children: [{ path: '/', element: <InicioPage /> }],
  },
  { path: '*', element: <NaoEncontradaPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
