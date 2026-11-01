import { Plus, SearchX, Search, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useClientes, type StatusCliente } from '@/api/clientes'
import { ApiError } from '@/api/client'
import { BotaoNovo } from '@/components/BotaoNovo'
import { EsqueletoCartoes } from '@/components/Esqueletos'
import { EstadoVazio } from '@/components/EstadoVazio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/lib/useDebounce'
import { cn } from '@/lib/utils'
import { ClienteCard } from './ClienteCard'

const ABAS: { param: string | null; status: StatusCliente; rotulo: string }[] = [
  { param: null, status: 'ATIVO', rotulo: 'Ativos' },
  { param: 'inativos', status: 'INATIVO', rotulo: 'Inativos' },
  { param: 'todos', status: 'TODOS', rotulo: 'Todos' },
]

export function ClientesPage() {
  const [params, setParams] = useSearchParams()
  const aba = ABAS.find((a) => a.param === params.get('status')) ?? ABAS[0]
  const [busca, setBusca] = useState('')
  const nome = useDebounce(busca.trim(), 400)
  const clientes = useClientes(nome, aba.status)

  const itens = clientes.data?.pages.flatMap((p) => p.content ?? []) ?? []
  const total = clientes.data?.pages[0]?.page.totalElements ?? 0
  const buscando = nome !== ''

  const mudarAba = (novaAba: (typeof ABAS)[number]) => {
    const proximo = new URLSearchParams(params)
    if (novaAba.param) proximo.set('status', novaAba.param)
    else proximo.delete('status')
    setParams(proximo, { replace: true })
  }

  return (
    <section className="flex flex-col gap-4 pb-16 md:pb-0">
      <h1 className="sr-only">Clientes</h1>

      {/* Busca + botão "Novo cliente" (no celular, o botão é o flutuante) */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome"
            aria-label="Buscar cliente por nome"
            className="h-12 bg-card pl-10 text-base"
          />
        </div>
        <BotaoNovo para="/clientes/novo" rotulo="Novo cliente" />
      </div>

      <div role="tablist" aria-label="Situação" className="grid w-full grid-cols-3 gap-1 rounded-xl border bg-secondary p-1 sm:w-80">
        {ABAS.map((a) => (
          <button
            key={a.rotulo}
            type="button"
            role="tab"
            aria-selected={a === aba}
            onClick={() => mudarAba(a)}
            className={cn(
              'h-10 rounded-lg text-sm font-medium transition-colors',
              a === aba ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {clientes.isPending && <EsqueletoCartoes quantidade={4} rotulo="Carregando clientes" />}

      {clientes.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 p-4">
          <p className="text-sm text-destructive">
            {clientes.error instanceof ApiError ? clientes.error.message : 'Não foi possível carregar os clientes.'}
          </p>
          <Button variant="outline" size="lg" className="h-11" onClick={() => clientes.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {clientes.isSuccess &&
        itens.length === 0 &&
        (buscando ? (
          <EstadoVazio
            icone={SearchX}
            titulo={`Nenhum cliente encontrado para “${nome}”`}
            descricao="Confira a grafia ou busque por outra parte do nome."
          />
        ) : aba.status === 'INATIVO' ? (
          <EstadoVazio icone={Store} titulo="Nenhum cliente inativo" descricao="Os clientes inativados aparecem aqui." />
        ) : (
          <EstadoVazio
            icone={Store}
            titulo="Nenhum cliente ainda"
            descricao="Cadastre a padaria, o açougue ou o restaurante que você atende para começar suas auditorias."
            acao={
              <Button asChild size="lg" className="h-12 w-full text-base">
                <Link to="/clientes/novo">
                  <Plus aria-hidden />
                  Cadastrar cliente
                </Link>
              </Button>
            }
          />
        ))}

      {itens.length > 0 && (
        <>
          <ul
            className={cn(
              'grid grid-cols-1 gap-3 transition-opacity md:grid-cols-2 lg:grid-cols-3',
              clientes.isPlaceholderData && 'opacity-60',
            )}
          >
            {itens.map((cliente) => (
              <li key={cliente.id}>
                <ClienteCard cliente={cliente} />
              </li>
            ))}
          </ul>
          <p className="text-center text-sm text-muted-foreground">
            Mostrando {itens.length} de {total} {total === 1 ? 'cliente' : 'clientes'}
          </p>
          {clientes.hasNextPage && (
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-base"
              disabled={clientes.isFetchingNextPage}
              onClick={() => clientes.fetchNextPage()}
            >
              {clientes.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
