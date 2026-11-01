import { Download, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  useExcluirAuditoria,
  useReabrirAuditoria,
  useRelatorioPdf,
  type AuditoriaResumo,
} from '@/api/auditorias'
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
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { baixar } from '@/lib/arquivo'
import { formatarData } from '@/lib/formatadores'

type Confirmacao = 'reabrir' | 'excluir' | null

/** Menu "⋯" da tabela: Baixar PDF e Reabrir (finalizada) ou Excluir (em andamento). */
export function AcoesAuditoria({ auditoria }: { auditoria: AuditoriaResumo }) {
  const id = auditoria.id!
  const finalizada = auditoria.status === 'FINALIZADA'
  const pdf = useRelatorioPdf(id)
  const reabrir = useReabrirAuditoria(id)
  const excluir = useExcluirAuditoria()
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null)
  const [erro, setErro] = useState<string | null>(null)

  const abrir = (qual: Confirmacao) => {
    setErro(null)
    setConfirmacao(qual)
  }

  // A tabela só aparece no computador: o PDF é baixado direto (sem a folha de compartilhar do celular).
  const baixarPdf = () =>
    pdf.mutate(undefined, {
      onSuccess: ({ blob, nome }) => {
        const url = URL.createObjectURL(blob)
        baixar(url, nome ?? `relatorio-${id}.pdf`)
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      },
    })

  const confirmar = () => {
    const aoErrar = (falha: Error) =>
      setErro(falha instanceof ApiError ? falha.message : 'Não foi possível concluir a ação.')
    if (confirmacao === 'reabrir') reabrir.mutate(undefined, { onSuccess: () => setConfirmacao(null), onError: aoErrar })
    if (confirmacao === 'excluir') excluir.mutate(id, { onSuccess: () => setConfirmacao(null), onError: aoErrar })
  }
  const pendente = reabrir.isPending || excluir.isPending

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Mais ações da auditoria de ${auditoria.clienteNome}`}
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {finalizada ? (
            <>
              <DropdownMenuItem className="h-10 cursor-pointer" disabled={pdf.isPending} onSelect={baixarPdf}>
                <Download aria-hidden />
                {pdf.isPending ? 'Gerando PDF…' : 'Baixar PDF'}
              </DropdownMenuItem>
              <DropdownMenuItem className="h-10 cursor-pointer" onSelect={() => abrir('reabrir')}>
                <RotateCcw aria-hidden />
                Reabrir
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem variant="destructive" className="h-10 cursor-pointer" onSelect={() => abrir('excluir')}>
              <Trash2 aria-hidden />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmacao !== null} onOpenChange={(aberto) => !aberto && setConfirmacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmacao === 'reabrir' ? 'Reabrir auditoria?' : 'Excluir auditoria?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmacao === 'reabrir'
                ? 'A nota será descartada até você finalizar de novo. As respostas continuam salvas.'
                : `A auditoria de ${auditoria.clienteNome} de ${formatarData(auditoria.dataAuditoria)} e todas as respostas serão apagadas. Não é possível desfazer.`}
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
              variant={confirmacao === 'excluir' ? 'destructive' : 'default'}
              className="h-11"
              disabled={pendente}
              onClick={(e) => {
                // Mantém o diálogo aberto até a API responder, para poder mostrar o erro.
                e.preventDefault()
                confirmar()
              }}
            >
              {confirmacao === 'reabrir'
                ? reabrir.isPending
                  ? 'Reabrindo…'
                  : 'Reabrir'
                : excluir.isPending
                  ? 'Excluindo…'
                  : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
