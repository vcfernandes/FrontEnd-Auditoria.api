import { Link, useParams } from 'react-router'
import { useChecklistParaEditar } from '@/api/checklists'
import { ApiError } from '@/api/client'
import { EsqueletoFormulario } from '@/components/Esqueletos'
import { Button } from '@/components/ui/button'
import { comBuscaLembrada } from '@/lib/ultimaLista'
import { EditorComRascunho } from './EditorComRascunho'

function Aviso({ texto, onTentarDeNovo }: { texto: string; onTentarDeNovo?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="text-destructive">{texto}</p>
      <div className="flex flex-wrap gap-2">
        {onTentarDeNovo && (
          <Button variant="outline" size="lg" className="h-11" onClick={onTentarDeNovo}>
            Tentar de novo
          </Button>
        )}
        <Button asChild variant="outline" size="lg" className="h-11">
          <Link to={comBuscaLembrada('/auditorias')}>Voltar para auditorias</Link>
        </Button>
      </div>
    </div>
  )
}

export function EditorModeloPage() {
  const { id } = useParams()
  const consulta = useChecklistParaEditar(id)

  if (!id) return <EditorComRascunho />

  if (consulta.isError) {
    const erro = consulta.error
    if (erro instanceof ApiError && erro.status === 404) return <Aviso texto="Modelo não encontrado." />
    return (
      <Aviso
        texto={erro instanceof ApiError ? erro.message : 'Não foi possível carregar o modelo.'}
        onTentarDeNovo={() => consulta.refetch()}
      />
    )
  }

  // Dado em cache pode estar velho: o formulário só nasce com a versão recém-buscada.
  if (!consulta.data || !consulta.isFetchedAfterMount) return <EsqueletoFormulario campos={4} />

  if (consulta.data.biblioteca) {
    return <Aviso texto="Modelos da Biblioteca não podem ser editados. Duplique o modelo para personalizar uma cópia." />
  }

  return <EditorComRascunho key={id} modelo={consulta.data} />
}
