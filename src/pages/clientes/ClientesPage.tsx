import { Plus, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useClientes } from '@/api/clientes'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/lib/useDebounce'
import { ClienteCard } from './ClienteCard'

function Carregando() {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label="Carregando clientes">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}

function NovoClienteLink({ className }: { className?: string }) {
  return (
    <Button asChild size="lg" className={className}>
      <Link to="/clientes/novo">
        <Plus aria-hidden />
        Novo cliente
      </Link>
    </Button>
  )
}

export function ClientesPage() {
  const [busca, setBusca] = useState('')
  const nome = useDebounce(busca.trim(), 400)
  const clientes = useClientes(nome)

  const itens = clientes.data?.pages.flatMap((p) => p.content ?? []) ?? []
  const total = clientes.data?.pages[0]?.page.totalElements ?? 0
  const buscando = nome !== ''

  return (
    <section className="flex flex-col gap-4 pb-16 md:pb-0">
      <div className="flex items-center justify-between gap-4">
        <h1 className="sr-only text-2xl font-semibold md:not-sr-only">Clientes</h1>
        <NovoClienteLink className="hidden h-11 md:inline-flex" />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome"
          aria-label="Buscar cliente por nome"
          className="h-12 pl-10 text-base"
        />
      </div>

      {clientes.isPending && <Carregando />}

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

      {clientes.isSuccess && itens.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <Users className="size-10 text-muted-foreground" aria-hidden />
          {buscando ? (
            <p className="font-medium">Nenhum cliente encontrado para “{nome}”</p>
          ) : (
            <>
              <p className="font-medium">Nenhum cliente ainda</p>
              <p className="text-sm text-muted-foreground">Cadastre o primeiro cliente para começar suas auditorias.</p>
              <NovoClienteLink className="h-12 w-full" />
            </>
          )}
        </div>
      )}

      {itens.length > 0 && (
        <>
          <ul className={`flex flex-col gap-3 transition-opacity ${clientes.isPlaceholderData ? 'opacity-60' : ''}`}>
            {itens.map((cliente) => (
              <li key={cliente.id}>
                <ClienteCard cliente={cliente} />
              </li>
            ))}
          </ul>
          <p className="text-center text-sm text-muted-foreground">
            {itens.length} de {total} {total === 1 ? 'cliente' : 'clientes'}
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

      {/* Botão flutuante (celular), acima da barra do rodapé e da área segura do iPhone */}
      <Link
        to="/clientes/novo"
        aria-label="Novo cliente"
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden"
      >
        <Plus className="size-7" aria-hidden />
      </Link>
    </section>
  )
}
