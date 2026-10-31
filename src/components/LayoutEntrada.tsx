import { ClipboardCheck } from 'lucide-react'
import type { ReactNode } from 'react'

export function LayoutEntrada({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ClipboardCheck className="size-6" aria-hidden />
        </div>
        <p className="text-xl font-semibold">Auditorias</p>
      </header>
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      {children}
    </main>
  )
}
