import { ClipboardPlus, Copy, Eye, ListChecks, MoreHorizontal, PowerOff } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useDuplicarChecklist, useInativarChecklist, type ModeloChecklist } from '@/api/checklists'
import { ApiError } from '@/api/client'
import { IconeQuadrado } from '@/components/IconeQuadrado'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PerguntasModelo } from './PerguntasModelo'

interface Props {
  modelo: ModeloChecklist
  /** Chamado depois de duplicar (a Biblioteca leva para Meus modelos). */
  onDuplicado?: () => void
}

export function ModeloCard({ modelo, onDuplicado }: Props) {
  const duplicar = useDuplicarChecklist()
  const inativar = useInativarChecklist()
  const [vendo, setVendo] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const quantidade = modelo.quantidadePerguntas ?? 0

  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <IconeQuadrado icone={ListChecks} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">{modelo.nome}</h2>
            {modelo.biblioteca && <Badge variant="secondary">Biblioteca</Badge>}
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {quantidade} {quantidade === 1 ? 'pergunta' : 'perguntas'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Mais ações para ${modelo.nome}`}
            className="-mt-1 -mr-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="size-5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem className="h-10 cursor-pointer" onSelect={() => setVendo(true)}>
              <Eye aria-hidden />
              Ver perguntas
            </DropdownMenuItem>
            <DropdownMenuItem
              className="h-10 cursor-pointer"
              disabled={duplicar.isPending}
              onSelect={() => duplicar.mutate(modelo.id!, { onSuccess: () => onDuplicado?.() })}
            >
              <Copy aria-hidden />
              {duplicar.isPending ? 'Duplicando…' : 'Duplicar'}
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="h-10 cursor-pointer">
              <Link to={`/auditorias/nova?modeloId=${modelo.id}`}>
                <ClipboardPlus aria-hidden />
                Iniciar auditoria
              </Link>
            </DropdownMenuItem>
            {!modelo.biblioteca && (
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
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {modelo.descricao && <p className="line-clamp-3 text-sm text-muted-foreground">{modelo.descricao}</p>}

      <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
        <Button variant="outline" size="lg" className="h-11" onClick={() => setVendo(true)}>
          <Eye aria-hidden />
          Ver perguntas
        </Button>
        <Button asChild size="lg" className="h-11">
          <Link to={`/auditorias/nova?modeloId=${modelo.id}`}>
            <ClipboardPlus aria-hidden />
            Iniciar
          </Link>
        </Button>
      </div>

      <PerguntasModelo modelo={modelo} aberto={vendo} onAbertoChange={setVendo} />

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar {modelo.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              O modelo deixa de aparecer em Meus modelos e não poderá ser usado em novas auditorias. As auditorias já
              feitas com ele não mudam.
            </AlertDialogDescription>
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
                e.preventDefault()
                inativar.mutate(modelo.id!, {
                  onSuccess: () => setConfirmando(false),
                  onError: (falha) =>
                    setErro(falha instanceof ApiError ? falha.message : 'Não foi possível inativar o modelo.'),
                })
              }}
            >
              {inativar.isPending ? 'Inativando…' : 'Inativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
