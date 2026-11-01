import { Filter, X } from 'lucide-react'
import { useState } from 'react'
import { useCliente } from '@/api/clientes'
import { Button } from '@/components/ui/button'
import { SeletorCliente } from './SeletorCliente'

interface Props {
  clienteId: string | null
  onChange: (clienteId: string | null) => void
}

export function FiltroCliente({ clienteId, onChange }: Props) {
  const [aberto, setAberto] = useState(false)
  // O id vem da URL: o nome é buscado para mostrar no filtro.
  const cliente = useCliente(clienteId ?? undefined)

  if (clienteId) {
    return (
      <div className="flex items-center gap-2 self-start rounded-full border border-primary bg-primary/5 py-1 pr-1 pl-3 text-sm">
        <span className="max-w-56 truncate">
          Cliente: <strong className="font-medium">{cliente.data?.nome ?? '…'}</strong>
        </span>
        <button
          type="button"
          aria-label="Remover filtro de cliente"
          onClick={() => onChange(null)}
          className="flex size-9 items-center justify-center rounded-full hover:bg-muted active:bg-muted"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    )
  }

  if (!aberto) {
    return (
      <Button type="button" variant="outline" size="lg" className="h-10 self-start" onClick={() => setAberto(true)}>
        <Filter aria-hidden />
        Filtrar por cliente
      </Button>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border bg-card p-3 sm:max-w-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Filtrar por cliente</span>
        <Button type="button" variant="ghost" size="lg" className="h-9" onClick={() => setAberto(false)}>
          Fechar
        </Button>
      </div>
      <SeletorCliente
        valor={null}
        onChange={(escolhido) => {
          if (!escolhido?.id) return
          setAberto(false)
          onChange(escolhido.id)
        }}
      />
    </div>
  )
}
