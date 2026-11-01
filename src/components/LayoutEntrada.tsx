import { ClipboardCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { AvisoOffline } from '@/pwa/AvisoOffline'

function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={
          claro
            ? 'flex size-11 items-center justify-center rounded-xl bg-white/15 text-white'
            : 'flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground'
        }
      >
        <ClipboardCheck className="size-6" aria-hidden />
      </div>
      <span className={claro ? 'text-xl font-semibold text-white' : 'text-xl font-semibold'}>Auditorias</span>
    </div>
  )
}

/**
 * Telas de entrada. Celular: topo azul-marinho + formulário.
 * Computador: formulário à esquerda e foto com camada azul-marinho e frase à direita.
 */
export function LayoutEntrada({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-2">
      <div className="flex min-h-dvh flex-col">
        <header className="bg-primary px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-6 md:hidden">
          <Logo claro />
          <p className="mt-2 text-sm text-white/75">Auditorias e inspeções sanitárias</p>
        </header>
        <AvisoOffline />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-8 md:py-12">
          <div className="hidden md:block">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold">{titulo}</h1>
          {children}
        </main>
      </div>

      <aside className="relative hidden overflow-hidden md:sticky md:top-0 md:block md:h-dvh">
        {/* Versão otimizada de public/login.jpg (1600 px, webp) */}
        <img src="/login.webp" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-primary/85" />
        <div className="relative flex h-full flex-col justify-end gap-4 p-12 text-white">
          <ClipboardCheck className="size-10 text-white/90" aria-hidden />
          <p className="max-w-md text-3xl leading-tight font-semibold">Inspeções sanitárias sem papelada.</p>
        </div>
      </aside>
    </div>
  )
}
