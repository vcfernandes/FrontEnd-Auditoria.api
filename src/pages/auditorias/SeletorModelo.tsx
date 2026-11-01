import { Check, ListChecks } from 'lucide-react'
import { useChecklists, type ModeloChecklist } from '@/api/checklists'
import { ApiError } from '@/api/client'
import { EsqueletoCartoes } from '@/components/Esqueletos'
import { IconeQuadrado } from '@/components/IconeQuadrado'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  valor: string
  onChange: (modeloId: string) => void
  modelos: ModeloChecklist[]
}

/** Lista de modelos selecionáveis (a busca fica no pai para poder pré-selecionar o único modelo). */
export function ListaModelos({ valor, onChange, modelos }: Props) {
  return (
    <div role="radiogroup" aria-label="Modelo de checklist" className="flex flex-col gap-2">
      {modelos.map((modelo) => {
        const selecionado = modelo.id === valor
        return (
          <button
            key={modelo.id}
            type="button"
            role="radio"
            aria-checked={selecionado}
            onClick={() => onChange(modelo.id!)}
            className={cn(
              'flex min-h-16 items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/40 active:bg-accent/60',
              selecionado && 'border-primary bg-accent/40 ring-1 ring-primary',
            )}
          >
            <IconeQuadrado icone={ListChecks} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{modelo.nome}</span>
                {modelo.biblioteca && <Badge variant="secondary">Biblioteca</Badge>}
              </div>
              {modelo.quantidadePerguntas !== undefined && (
                <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                  {modelo.quantidadePerguntas} {modelo.quantidadePerguntas === 1 ? 'pergunta' : 'perguntas'}
                </p>
              )}
              {modelo.descricao && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{modelo.descricao}</p>
              )}
            </div>
            {selecionado && <Check className="size-5 shrink-0 text-primary" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}

export function EstadoModelos({ consulta }: { consulta: ReturnType<typeof useChecklists> }) {
  if (consulta.isPending) {
    return <EsqueletoCartoes quantidade={2} rotulo="Carregando modelos" />
  }
  if (consulta.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="text-sm text-destructive">
          {consulta.error instanceof ApiError ? consulta.error.message : 'Não foi possível carregar os modelos.'}
        </p>
        <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => consulta.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }
  return null
}
