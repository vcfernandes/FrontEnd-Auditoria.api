import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONS = {
  primario: 'bg-primary-suave text-primary',
  sucesso: 'bg-emerald-600/10 text-emerald-700',
}

/** Estado vazio: ícone grande, título amigável, explicação curta e, se houver, uma ação. */
export function EstadoVazio({
  icone: Icone,
  titulo,
  descricao,
  acao,
  tom = 'primario',
  className,
}: {
  icone: LucideIcon
  titulo: string
  descricao?: ReactNode
  acao?: ReactNode
  tom?: keyof typeof TONS
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-10 text-center',
        className,
      )}
    >
      <span className={cn('mb-1 flex size-16 items-center justify-center rounded-full', TONS[tom])}>
        <Icone className="size-8" aria-hidden />
      </span>
      <p className="text-base font-semibold">{titulo}</p>
      {descricao && <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>}
      {acao && <div className="mt-2 w-full max-w-xs">{acao}</div>}
    </div>
  )
}
