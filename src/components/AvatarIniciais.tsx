import { iniciais } from '@/lib/formatadores'
import { cn } from '@/lib/utils'

// Mesmo estilo suave dos tons de IconeQuadrado, com mais variações para distinguir clientes.
const CORES = [
  'bg-rose-500/15 text-rose-700',
  'bg-orange-500/15 text-orange-700',
  'bg-amber-500/15 text-amber-700',
  'bg-lime-500/15 text-lime-700',
  'bg-emerald-600/15 text-emerald-700',
  'bg-teal-500/15 text-teal-700',
  'bg-cyan-500/15 text-cyan-700',
  'bg-sky-500/15 text-sky-700',
  'bg-indigo-500/15 text-indigo-700',
  'bg-violet-500/15 text-violet-700',
  'bg-fuchsia-500/15 text-fuchsia-700',
  'bg-pink-500/15 text-pink-700',
]

/** Sempre a mesma cor para o mesmo nome. */
function corDoNome(nome: string) {
  let hash = 0
  for (let i = 0; i < nome.length; i++) hash = (hash * 31 + nome.charCodeAt(i)) >>> 0
  return CORES[hash % CORES.length]
}

export function AvatarIniciais({ nome, className }: { nome: string; className?: string }) {
  return (
    <span
      className={cn('flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold', corDoNome(nome), className)}
      aria-hidden
    >
      {iniciais(nome)}
    </span>
  )
}
