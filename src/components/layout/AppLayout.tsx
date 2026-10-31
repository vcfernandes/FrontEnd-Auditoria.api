import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { Link, NavLink, Outlet, useMatches } from 'react-router'
import { cn } from '@/lib/utils'
import { itensNavegacao } from './itensNavegacao'

/** Cada rota pode declarar `handle: { titulo }` para aparecer no cabeçalho do celular. */
export interface RotaHandle {
  titulo?: string
  /** Telas internas: mostra a seta de voltar no cabeçalho do celular. */
  voltar?: string
}

export function AppLayout() {
  const handle = useMatches()
    .map((m) => m.handle as RotaHandle | undefined)
    .findLast((h) => h?.titulo)
  const titulo = handle?.titulo

  return (
    <div className="min-h-dvh md:pl-60">
      {/* Menu lateral (computador) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 border-r bg-background p-4 md:flex">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardCheck className="size-5" aria-hidden />
          </div>
          <span className="text-lg font-semibold">Auditorias</span>
        </div>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {itensNavegacao.map(({ rotulo, caminho, icone: Icone }) => (
            <NavLink
              key={caminho}
              to={caminho}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icone className="size-5" aria-hidden />
              {rotulo}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Cabeçalho (celular) */}
      <header className="sticky top-0 z-10 border-b bg-background pt-[env(safe-area-inset-top)] md:hidden">
        <div className="flex h-14 items-center gap-1 px-2">
          {handle?.voltar && (
            <Link
              to={handle.voltar}
              aria-label="Voltar"
              className="flex size-11 items-center justify-center rounded-lg active:bg-muted"
            >
              <ArrowLeft className="size-6" aria-hidden />
            </Link>
          )}
          <p className={cn('text-lg font-semibold', !handle?.voltar && 'px-2')}>{titulo}</p>
        </div>
      </header>

      {/* Espaço extra embaixo no celular para a barra fixa e a área segura do iPhone */}
      <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-8 md:py-10 md:pb-10">
        <Outlet />
      </div>

      {/* Barra inferior (celular) */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-3">
          {itensNavegacao.map(({ rotulo, caminho, icone: Icone }) => (
            <li key={caminho}>
              <NavLink
                to={caminho}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icone className={cn('size-6', isActive && 'stroke-[2.5]')} aria-hidden />
                    {rotulo}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
