import { createBrowserRouter, RouterProvider } from 'react-router'
import { InicioPage } from '@/pages/inicio/InicioPage'
import { NaoEncontradaPage } from '@/pages/nao-encontrada/NaoEncontradaPage'

const router = createBrowserRouter([
  { path: '/', element: <InicioPage /> },
  { path: '*', element: <NaoEncontradaPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
