import { Link, Navigate, useParams } from 'react-router'
import { useAuditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Questionario } from './Questionario'

export function ResponderAuditoriaPage() {
  const { id } = useParams()
  const auditoria = useAuditoria(id)

  if (auditoria.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy aria-label="Carregando auditoria">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (auditoria.isError) {
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
          <Link to="/auditorias">Voltar para auditorias</Link>
        </Button>
      </div>
    )
  }

  if (auditoria.data.status === 'FINALIZADA') {
    return <Navigate to={`/auditorias/${id}/resultado`} replace />
  }

  return <Questionario key={id} auditoria={auditoria.data} />
}
