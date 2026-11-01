import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const TONS = {
  primario: 'bg-primary-suave text-primary',
  sucesso: 'bg-emerald-600/10 text-emerald-700',
  perigo: 'bg-red-600/10 text-red-700',
  alerta: 'bg-amber-500/15 text-amber-700',
  info: 'bg-sky-500/15 text-sky-700',
  neutro: 'bg-muted text-muted-foreground',
}

export type TomIcone = keyof typeof TONS

/** Ícone dentro de um quadrado com fundo colorido suave (usado nos cartões). */
export function IconeQuadrado({
  icone: Icone,
  tom = 'primario',
  className,
}: {
  icone: LucideIcon
  tom?: TomIcone
  className?: string
}) {
  return (
    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', TONS[tom], className)}>
      <Icone className="size-5" aria-hidden />
    </span>
  )
}
