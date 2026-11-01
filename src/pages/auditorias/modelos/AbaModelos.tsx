import { Library, ListChecks } from 'lucide-react'
import { useChecklists } from '@/api/checklists'
import { ApiError } from '@/api/client'
import { EsqueletoCartoes } from '@/components/Esqueletos'
import { EstadoVazio } from '@/components/EstadoVazio'
import { Button } from '@/components/ui/button'
import { ModeloCard } from './ModeloCard'

interface Props {
  /** true = Biblioteca (modelos padrão); false = Meus modelos (da organização). */
  biblioteca: boolean
  onIrParaBiblioteca: () => void
  onIrParaMeusModelos: () => void
}

export function AbaModelos({ biblioteca, onIrParaBiblioteca, onIrParaMeusModelos }: Props) {
  const consulta = useChecklists()
  // Inativados não aparecem (não podem ser usados em novas auditorias).
  const modelos = (consulta.data ?? []).filter((m) => !!m.biblioteca === biblioteca && m.ativo !== false)

  if (consulta.isPending) return <EsqueletoCartoes quantidade={3} rotulo="Carregando modelos" />

  if (consulta.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-card p-4">
        <p className="text-sm text-destructive">
          {consulta.error instanceof ApiError ? consulta.error.message : 'Não foi possível carregar os modelos.'}
        </p>
        <Button variant="outline" size="lg" className="h-11" onClick={() => consulta.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  if (modelos.length === 0) {
    return biblioteca ? (
      <EstadoVazio icone={Library} titulo="Nenhum modelo na Biblioteca" descricao="Os modelos padrão aparecem aqui." />
    ) : (
      <EstadoVazio
        icone={ListChecks}
        titulo="Você ainda não tem modelos próprios"
        descricao="Duplique um modelo da Biblioteca (como a RDC 216/2004) para ter uma cópia da sua organização."
        acao={
          <Button size="lg" className="h-12 w-full text-base" onClick={onIrParaBiblioteca}>
            <Library aria-hidden />
            Ver a Biblioteca
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {biblioteca && (
        <p className="text-sm text-muted-foreground">
          Modelos padrão, prontos para usar. Duplique para ter uma cópia em Meus modelos.
        </p>
      )}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modelos.map((modelo) => (
          <li key={modelo.id}>
            <ModeloCard modelo={modelo} onDuplicado={biblioteca ? onIrParaMeusModelos : undefined} />
          </li>
        ))}
      </ul>
    </div>
  )
}
