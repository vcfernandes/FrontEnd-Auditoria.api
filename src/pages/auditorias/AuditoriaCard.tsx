import { ChevronRight, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useExcluirAuditoria, type AuditoriaResumo } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CLASSIFICACOES } from '@/lib/classificacao'
import { formatarData, formatarNota } from '@/lib/formatadores'
import { cn } from '@/lib/utils'

function Progresso({ resumo }: { resumo: NonNullable<AuditoriaResumo['resumo']> }) {
  const total = resumo.total ?? 0
  const respondidas = resumo.respondidas ?? 0
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary" style={{ width: `${total ? (respondidas / total) * 100 : 0}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {respondidas}/{total} respondidas
      </span>
    </div>
  )
}

function Excluir({ auditoria }: { auditoria: AuditoriaResumo }) {
  const excluir = useExcluirAuditoria()
  const [erro, setErro] = useState<string | null>(null)

  return (
    <AlertDialog onOpenChange={() => setErro(null)}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label={`Excluir auditoria de ${auditoria.clienteNome}`}
          className="flex size-12 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:bg-destructive/10"
        >
          <Trash2 className="size-5" aria-hidden />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir auditoria?</AlertDialogTitle>
          <AlertDialogDescription>
            A auditoria de {auditoria.clienteNome} de {formatarData(auditoria.dataAuditoria)} e todas as respostas
            serão apagadas. Não é possível desfazer.
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
            disabled={excluir.isPending}
            onClick={(e) => {
              // Mantém o diálogo aberto até a API responder, para poder mostrar o erro.
              e.preventDefault()
              excluir.mutate(auditoria.id!, {
                onError: (falha) =>
                  setErro(falha instanceof ApiError ? falha.message : 'Não foi possível excluir a auditoria.'),
              })
            }}
          >
            {excluir.isPending ? 'Excluindo…' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AuditoriaCard({ auditoria }: { auditoria: AuditoriaResumo }) {
  const emAndamento = auditoria.status === 'EM_ANDAMENTO'
  const destino = `/auditorias/${auditoria.id}/${emAndamento ? 'responder' : 'resultado'}`
  const classificacao = auditoria.classificacao ? CLASSIFICACOES[auditoria.classificacao] : null

  return (
    <div className="flex items-center gap-1 rounded-xl border bg-card pr-1 text-card-foreground">
      <Link
        to={destino}
        className="flex min-h-20 min-w-0 flex-1 items-center gap-3 rounded-xl p-4 transition-colors hover:bg-muted active:bg-muted"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{auditoria.clienteNome}</p>
          <p className="truncate text-sm text-muted-foreground">
            {formatarData(auditoria.dataAuditoria)} · {auditoria.modeloNome}
          </p>
          {emAndamento && auditoria.resumo && <Progresso resumo={auditoria.resumo} />}
        </div>
        {!emAndamento && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-lg font-semibold tabular-nums">{formatarNota(auditoria.nota)}</span>
            {classificacao && (
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', classificacao.classes)}>
                {classificacao.rotulo}
              </span>
            )}
          </div>
        )}
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
      {emAndamento && <Excluir auditoria={auditoria} />}
    </div>
  )
}
