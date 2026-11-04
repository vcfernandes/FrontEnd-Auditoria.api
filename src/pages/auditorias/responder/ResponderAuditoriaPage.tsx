import { Link, Navigate, useParams } from 'react-router'
import { useAuditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { EsqueletoQuestionario } from '@/components/Esqueletos'
import { Button } from '@/components/ui/button'
import { comBuscaLembrada } from '@/lib/ultimaLista'
import { Questionario } from './Questionario'

export function ResponderAuditoriaPage() {
  const { id } = useParams()
  const auditoria = useAuditoria(id)

  if (auditoria.isPending) {
    return <EsqueletoQuestionario />
  }

  // Só sem dados: uma nova busca que falhe (rede ruim) não pode tirar da tela as respostas e fotos em andamento.
  if (!auditoria.data) {
    const erro = auditoria.error
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-destructive">
          {erro instanceof ApiError && erro.status === 404
            ? 'Auditoria não encontrada.'
            : erro instanceof ApiError
              ? erro.message
              : 'Não foi possível carregar a auditoria.'}
        </p>
        <Button asChild variant="outline" size="lg" className="h-11">
          <Link to={comBuscaLembrada('/auditorias')}>Voltar para auditorias</Link>
        </Button>
      </div>
    )
  }

  if (auditoria.data.status === 'FINALIZADA') {
    return <Navigate to={`/auditorias/${id}/resultado`} replace />
  }

  return <Questionario key={id} auditoria={auditoria.data} />
}
