import { ClipboardPlus } from 'lucide-react'
import { Link } from 'react-router'
import { useChecklist, type ModeloChecklist } from '@/api/checklists'
import { ApiError } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

const porOrdem = (a: { ordem?: number }, b: { ordem?: number }) => (a.ordem ?? 0) - (b.ordem ?? 0)

function Conteudo({ id }: { id: string }) {
  const consulta = useChecklist(id)

  if (consulta.isPending) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-busy aria-label="Carregando perguntas">
        <Skeleton className="h-5 w-1/2" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }
  if (consulta.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 p-4">
        <p className="text-sm text-destructive">
          {consulta.error instanceof ApiError ? consulta.error.message : 'Não foi possível carregar as perguntas.'}
        </p>
        <Button variant="outline" size="lg" className="h-11" onClick={() => consulta.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  // Numeração contínua entre as seções (1, 2, 3… como no checklist impresso).
  const secoes = [...(consulta.data.secoes ?? [])].sort(porOrdem).map((secao) => ({
    ...secao,
    perguntas: [...(secao.perguntas ?? [])].sort(porOrdem),
  }))
  const inicios = secoes.map((_, i) => secoes.slice(0, i).reduce((soma, s) => soma + s.perguntas.length, 0))

  return (
    <div className="flex flex-col gap-6 p-4">
      {secoes.map((secao, indice) => {
        const perguntas = secao.perguntas
        return (
          <section key={secao.id} className="flex flex-col gap-2">
            <h3 className="flex items-baseline justify-between gap-3 font-semibold">
              <span>{secao.titulo}</span>
              <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
                {perguntas.length} {perguntas.length === 1 ? 'pergunta' : 'perguntas'}
              </span>
            </h3>
            <ol className="flex flex-col divide-y rounded-lg border">
              {perguntas.map((p, i) => {
                return (
                  <li key={p.id} className="flex gap-3 p-3 text-sm">
                    <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">{inicios[indice] + i + 1}.</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p>{p.texto}</p>
                      {(p.obrigatoria || p.referenciaLegal) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {p.obrigatoria && <Badge variant="secondary">Obrigatória</Badge>}
                          {p.referenciaLegal && (
                            <span className="text-xs text-muted-foreground">{p.referenciaLegal}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

/** Seções e perguntas do modelo, só leitura. As perguntas só são buscadas quando o painel abre. */
export function PerguntasModelo({
  modelo,
  aberto,
  onAbertoChange,
}: {
  modelo: ModeloChecklist
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
}) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{modelo.nome}</DialogTitle>
          <DialogDescription>
            {modelo.quantidadePerguntas ?? 0} {modelo.quantidadePerguntas === 1 ? 'pergunta' : 'perguntas'}
            {modelo.descricao ? ` · ${modelo.descricao}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">{aberto && <Conteudo id={modelo.id!} />}</div>
        <DialogFooter>
          <Button asChild size="lg" className="h-11">
            <Link to={`/auditorias/nova?modeloId=${modelo.id}`}>
              <ClipboardPlus aria-hidden />
              Iniciar auditoria com este modelo
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
