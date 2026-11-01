import { Link } from 'react-router'
import type { AuditoriaResumo } from '@/api/auditorias'
import { Button } from '@/components/ui/button'
import { CLASSIFICACOES } from '@/lib/classificacao'
import { formatarData, formatarNota } from '@/lib/formatadores'
import { cn } from '@/lib/utils'
import { AcoesAuditoria } from './AcoesAuditoria'

function EtiquetaStatus({ emAndamento }: { emAndamento: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        emAndamento ? 'bg-amber-500/15 text-amber-800' : 'bg-emerald-600/10 text-emerald-700',
      )}
    >
      {emAndamento ? 'Em andamento' : 'Finalizada'}
    </span>
  )
}

function Resultado({ auditoria }: { auditoria: AuditoriaResumo }) {
  if (auditoria.status === 'EM_ANDAMENTO') {
    const total = auditoria.resumo?.total ?? 0
    const respondidas = auditoria.resumo?.respondidas ?? 0
    return (
      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-label={`Progresso: ${respondidas} de ${total}`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={respondidas}
          className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${total ? (respondidas / total) * 100 : 0}%` }} />
        </div>
        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          {respondidas}/{total}
        </span>
      </div>
    )
  }
  const classificacao = auditoria.classificacao ? CLASSIFICACOES[auditoria.classificacao] : null
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold tabular-nums">{formatarNota(auditoria.nota)}</span>
      {classificacao && (
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', classificacao.classes)}>
          {classificacao.rotulo}
        </span>
      )}
    </div>
  )
}

const th = 'px-4 py-3 font-medium'

/** Lista de auditorias no computador. No celular a página usa os cartões. */
export function TabelaAuditorias({ itens, apagada }: { itens: AuditoriaResumo[]; apagada: boolean }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border bg-card transition-opacity', apagada && 'opacity-60')}>
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className={th}>Cliente</th>
            <th className={th}>Modelo</th>
            <th className={th}>Data</th>
            <th className={th}>Status</th>
            <th className={th}>Progresso / Nota</th>
            <th className={cn(th, 'text-right')}>Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {itens.map((a) => {
            const emAndamento = a.status === 'EM_ANDAMENTO'
            return (
              <tr key={a.id} className="transition-colors hover:bg-accent/30">
                <td className="max-w-56 px-4 py-3">
                  <p className="truncate font-medium" title={a.clienteNome}>
                    {a.clienteNome}
                  </p>
                </td>
                <td className="max-w-56 px-4 py-3">
                  <p className="truncate text-muted-foreground" title={a.modeloNome}>
                    {a.modeloNome}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatarData(a.dataAuditoria)}</td>
                <td className="px-4 py-3">
                  <EtiquetaStatus emAndamento={emAndamento} />
                </td>
                <td className="px-4 py-3">
                  <Resultado auditoria={a} />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="outline" size="lg" className="h-10 min-w-32">
                      <Link to={`/auditorias/${a.id}/${emAndamento ? 'responder' : 'resultado'}`}>
                        {emAndamento ? 'Continuar' : 'Ver resultado'}
                      </Link>
                    </Button>
                    <AcoesAuditoria auditoria={a} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
