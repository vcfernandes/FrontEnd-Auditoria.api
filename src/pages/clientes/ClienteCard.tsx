import { ClipboardPlus, MoreVertical, Pencil, Power, PowerOff } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useInativarCliente, useReativarCliente, type Cliente } from '@/api/clientes'
import { ApiError } from '@/api/client'
import { AvatarIniciais } from '@/components/AvatarIniciais'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { mascararCnpj } from '@/lib/formatadores'
import { cn } from '@/lib/utils'

function EtiquetaStatus({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
        ativo ? 'bg-emerald-600/10 text-emerald-700' : 'bg-muted text-muted-foreground',
      )}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function MenuCliente({ cliente }: { cliente: Cliente }) {
  const inativar = useInativarCliente(cliente.id!)
  const reativar = useReativarCliente(cliente.id!)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Mais ações para ${cliente.nome}`}
            onClick={(e) => e.stopPropagation()}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:bg-muted"
          >
            <MoreVertical className="size-5" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild className="h-10 cursor-pointer">
            <Link to={`/clientes/${cliente.id}`}>
              <Pencil aria-hidden />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="h-10 cursor-pointer">
            <Link to={`/auditorias/nova?clienteId=${cliente.id}`}>
              <ClipboardPlus aria-hidden />
              Nova auditoria para este cliente
            </Link>
          </DropdownMenuItem>
          {cliente.ativo ? (
            <DropdownMenuItem
              variant="destructive"
              className="h-10 cursor-pointer"
              onSelect={() => {
                setErro(null)
                setConfirmando(true)
              }}
            >
              <PowerOff aria-hidden />
              Inativar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="h-10 cursor-pointer"
              disabled={reativar.isPending}
              onSelect={() => reativar.mutate()}
            >
              <Power aria-hidden />
              Reativar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar {cliente.nome}?</AlertDialogTitle>
            <AlertDialogDescription>O cliente deixará de aparecer na lista de ativos.</AlertDialogDescription>
          </AlertDialogHeader>
          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="h-11"
              disabled={inativar.isPending}
              onClick={(e) => {
                // Mantém o diálogo aberto até a API responder, para poder mostrar o erro.
                e.preventDefault()
                inativar.mutate(undefined, {
                  onSuccess: () => setConfirmando(false),
                  onError: (falha) =>
                    setErro(falha instanceof ApiError ? falha.message : 'Não foi possível inativar o cliente.'),
                })
              }}
            >
              {inativar.isPending ? 'Inativando…' : 'Inativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function ClienteCard({ cliente }: { cliente: Cliente }) {
  const ativo = cliente.ativo !== false

  return (
    <div className="flex items-center gap-1 rounded-xl border bg-card pr-1 text-card-foreground transition-colors hover:border-primary/30">
      <Link
        to={`/clientes/${cliente.id}`}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-xl p-4 transition-colors hover:bg-accent/40 active:bg-accent/60"
      >
        <AvatarIniciais nome={cliente.nome ?? ''} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{cliente.nome}</p>
            <EtiquetaStatus ativo={ativo} />
          </div>
          {(cliente.categoria || cliente.cnpj) && (
            <p className="truncate text-sm text-muted-foreground">
              {[cliente.categoria, cliente.cnpj && mascararCnpj(cliente.cnpj)].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </Link>
      <MenuCliente cliente={cliente} />
    </div>
  )
}
