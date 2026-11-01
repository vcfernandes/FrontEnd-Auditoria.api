import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { Link, NavLink, Outlet, useMatches } from 'react-router'
import { cn } from '@/lib/utils'
import { AvisoOffline } from '@/pwa/AvisoOffline'
import { itensNavegacao } from './itensNavegacao'
import { MenuUsuario } from './MenuUsuario'

/** Cada rota pode declarar `handle: { titulo }` para aparecer no cabeçalho (celular e computador). */
export interface RotaHandle {
  titulo?: string
  /** Telas internas: mostra a seta de voltar no cabeçalho. */
  voltar?: string
  /** Conteúdo mais largo no computador (ex.: painel com cartões em linha e duas colunas). */
  larga?: boolean
}

function BotaoVoltar({ para }: { para: string }) {
  return (
    <Link
      to={para}
      aria-label="Voltar"
      className="flex size-11 items-center justify-center rounded-lg hover:bg-muted active:bg-muted"
    >
      <ArrowLeft className="size-6" aria-hidden />
    </Link>
  )
}

export function AppLayout() {
  const handle = useMatches()
    .map((m) => m.handle as RotaHandle | undefined)
    .findLast((h) => h?.titulo)
  const titulo = handle?.titulo

  return (
    <div className="min-h-dvh bg-muted/40 md:pl-60">
      {/* Menu lateral (computador): fundo azul-marinho, texto claro */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-8 bg-sidebar p-4 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ClipboardCheck className="size-5" aria-hidden />
          </div>
          <span className="text-lg font-semibold text-white">Auditorias</span>
        </div>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {itensNavegacao.map(({ rotulo, caminho, icone: Icone }) => (
            <NavLink
              key={caminho}
              to={caminho}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--sidebar-ring)]'
                    : 'hover:bg-sidebar-accent/60 hover:text-white',
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
          {handle?.voltar && <BotaoVoltar para={handle.voltar} />}
          <p className={cn('text-lg font-semibold', !handle?.voltar && 'px-2')}>{titulo}</p>
        </div>
      </header>

      {/* Cabeçalho (computador): título à esquerda, usuário à direita */}
      <header className="sticky top-0 z-10 hidden h-16 items-center justify-between gap-4 border-b bg-background/95 px-8 backdrop-blur md:flex">
        <div className="flex min-w-0 items-center gap-2">
          {handle?.voltar && <BotaoVoltar para={handle.voltar} />}
          <p className="truncate text-xl font-semibold">{titulo}</p>
        </div>
        <MenuUsuario />
      </header>

      <AvisoOffline />

      {/* Espaço extra embaixo no celular para a barra fixa e a área segura do iPhone. */}
      {/* Sem mx-auto: o conteúdo começa logo depois do menu, sem a faixa vazia no meio em telas largas. */}
      <div
        className={cn(
          'w-full px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-8 md:py-10 md:pb-10',
          handle?.larga ? 'max-w-7xl' : 'max-w-4xl',
        )}
      >
        <Outlet />
      </div>

      {/* Barra inferior (celular) */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-4">
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
                    <span
                      className={cn(
                        'flex h-7 w-14 items-center justify-center rounded-full transition-colors',
                        isActive && 'bg-primary-suave',
                      )}
                    >
                      <Icone className={cn('size-6', isActive && 'stroke-[2.5]')} aria-hidden />
                    </span>
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
