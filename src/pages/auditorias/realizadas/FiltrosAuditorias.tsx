import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { StatusAuditoria } from '@/api/auditorias'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/lib/useDebounce'
import { cn } from '@/lib/utils'
import { FiltroCliente } from '../FiltroCliente'

export interface ValoresFiltro {
  busca: string
  status?: StatusAuditoria
  clienteId: string | null
  de: string
  ate: string
}

interface Props {
  valores: ValoresFiltro
  onChange: (mudancas: Partial<ValoresFiltro>) => void
  onLimpar: () => void
}

const OPCOES_STATUS: { valor?: StatusAuditoria; rotulo: string }[] = [
  { rotulo: 'Todos' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'FINALIZADA', rotulo: 'Finalizadas' },
]

export function FiltrosAuditorias({ valores, onChange, onLimpar }: Props) {
  // O texto digitado fica local e só vai para o endereço (e para a API) 400 ms depois da última tecla.
  const [texto, setTexto] = useState(valores.busca)
  const busca = useDebounce(texto.trim(), 400)
  useEffect(() => {
    if (busca !== valores.busca) onChange({ busca })
    // Só reage ao texto: ao limpar os filtros o endereço muda antes e não pode trazer a busca antiga de volta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca])

  const temFiltro = !!(valores.busca || texto || valores.status || valores.clienteId || valores.de || valores.ate)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por cliente ou modelo"
          aria-label="Buscar por nome do cliente ou do modelo"
          className="h-12 bg-card pl-10 text-base"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div role="radiogroup" aria-label="Status" className="grid grid-cols-3 gap-1 rounded-xl border bg-secondary p-1">
          {OPCOES_STATUS.map((opcao) => {
            const ativo = opcao.valor === valores.status
            return (
              <button
                key={opcao.rotulo}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => onChange({ status: opcao.valor })}
                className={cn(
                  'h-9 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors',
                  ativo ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opcao.rotulo}
              </button>
            )
          })}
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
          <label className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground sm:gap-2">
            De
            <Input
              type="date"
              value={valores.de}
              max={valores.ate || undefined}
              onChange={(e) => onChange({ de: e.target.value })}
              autoComplete="off"
              className="h-10 w-full min-w-0 bg-card px-1.5 text-foreground sm:w-40 sm:px-2.5"
            />
          </label>
          <label className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground sm:gap-2">
            Até
            <Input
              type="date"
              value={valores.ate}
              min={valores.de || undefined}
              onChange={(e) => onChange({ ate: e.target.value })}
              autoComplete="off"
              className="h-10 w-full min-w-0 bg-card px-1.5 text-foreground sm:w-40 sm:px-2.5"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <FiltroCliente clienteId={valores.clienteId} onChange={(clienteId) => onChange({ clienteId })} />
        {temFiltro && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-10 text-primary"
            onClick={() => {
              setTexto('')
              onLimpar()
            }}
          >
            <X aria-hidden />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
