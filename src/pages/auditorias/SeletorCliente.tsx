import { Check, Search, Store } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useClientes, type Cliente } from '@/api/clientes'
import { ApiError } from '@/api/client'
import { EsqueletoCartoes } from '@/components/Esqueletos'
import { EstadoVazio } from '@/components/EstadoVazio'
import { IconeQuadrado } from '@/components/IconeQuadrado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mascararCnpj } from '@/lib/formatadores'
import { useDebounce } from '@/lib/useDebounce'

interface Props {
  valor: Cliente | null
  onChange: (cliente: Cliente | null) => void
}

function detalhes(cliente: Cliente) {
  return [cliente.categoria, cliente.cnpj && mascararCnpj(cliente.cnpj)].filter(Boolean).join(' · ')
}

export function SeletorCliente({ valor, onChange }: Props) {
  const [busca, setBusca] = useState('')
  const nome = useDebounce(busca.trim(), 400)
  const clientes = useClientes(nome)
  const itens = clientes.data?.pages.flatMap((p) => p.content ?? []) ?? []

  if (valor) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary bg-accent/40 p-4 ring-1 ring-primary">
        <IconeQuadrado icone={Check} className="bg-primary text-primary-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{valor.nome}</p>
          {detalhes(valor) && <p className="truncate text-sm text-muted-foreground">{detalhes(valor)}</p>}
        </div>
        <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => onChange(null)}>
          Trocar
        </Button>
      </div>
    )
  }

  const semClientes = clientes.isSuccess && itens.length === 0 && nome === ''

  if (semClientes) {
    return (
      <EstadoVazio
        icone={Store}
        titulo="Você ainda não tem clientes"
        descricao="Cadastre o estabelecimento que será auditado e volte aqui."
        acao={
          <Button asChild size="lg" className="h-12 w-full text-base">
            <Link to="/clientes/novo">Cadastrar cliente</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente por nome"
          aria-label="Buscar cliente por nome"
          className="h-12 bg-card pl-10 text-base"
        />
      </div>

      {clientes.isPending && <EsqueletoCartoes quantidade={3} rotulo="Carregando clientes" />}

      {clientes.isError && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-sm text-destructive">
            {clientes.error instanceof ApiError ? clientes.error.message : 'Não foi possível carregar os clientes.'}
          </p>
          <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => clientes.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {clientes.isSuccess && itens.length === 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">Nenhum cliente encontrado para “{nome}”.</p>
      )}

      {itens.length > 0 && (
        <ul className={`flex flex-col gap-2 transition-opacity ${clientes.isPlaceholderData ? 'opacity-60' : ''}`}>
          {itens.map((cliente) => (
            <li key={cliente.id}>
              <button
                type="button"
                onClick={() => onChange(cliente)}
                className="flex min-h-16 w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-accent/40 active:bg-accent/60"
              >
                <IconeQuadrado icone={Store} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{cliente.nome}</span>
                  {detalhes(cliente) && (
                    <span className="truncate text-sm text-muted-foreground">{detalhes(cliente)}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {clientes.hasNextPage && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          disabled={clientes.isFetchingNextPage}
          onClick={() => clientes.fetchNextPage()}
        >
          {clientes.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
        </Button>
      )}
    </div>
  )
}
