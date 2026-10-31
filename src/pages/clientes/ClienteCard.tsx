import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import type { Cliente } from '@/api/clientes'
import { mascararCnpj } from '@/lib/formatadores'

export function ClienteCard({ cliente }: { cliente: Cliente }) {
  return (
    <Link
      to={`/clientes/${cliente.id}`}
      className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-4 text-card-foreground transition-colors hover:bg-muted active:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{cliente.nome}</p>
        {(cliente.categoria || cliente.cnpj) && (
          <p className="truncate text-sm text-muted-foreground">
            {[cliente.categoria, cliente.cnpj && mascararCnpj(cliente.cnpj)].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}
