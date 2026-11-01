import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useReabrirAuditoria } from '@/api/auditorias'
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
import { Button } from '@/components/ui/button'

export function BotaoReabrir({ auditoriaId }: { auditoriaId: string }) {
  const navigate = useNavigate()
  const reabrir = useReabrirAuditoria(auditoriaId)
  const [erro, setErro] = useState<string | null>(null)

  return (
    <AlertDialog onOpenChange={() => setErro(null)}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="lg" className="h-12 text-base">
          <RotateCcw aria-hidden />
          Reabrir auditoria
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reabrir auditoria?</AlertDialogTitle>
          <AlertDialogDescription>
            A nota será descartada até você finalizar de novo. As respostas continuam salvas.
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
            className="h-11"
            disabled={reabrir.isPending}
            onClick={(e) => {
              // Mantém o diálogo aberto até a API responder, para poder mostrar o erro.
              e.preventDefault()
              reabrir.mutate(undefined, {
                onSuccess: () => navigate(`/auditorias/${auditoriaId}/responder`, { replace: true }),
                onError: (falha) =>
                  setErro(falha instanceof ApiError ? falha.message : 'Não foi possível reabrir a auditoria.'),
              })
            }}
          >
            {reabrir.isPending ? 'Reabrindo…' : 'Reabrir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
