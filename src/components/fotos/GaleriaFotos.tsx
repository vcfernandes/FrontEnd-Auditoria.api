import { AlertTriangle, ImageOff, Loader2, RotateCw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { filaFotos, useExcluirFoto, useImagemFoto, type Foto } from '@/api/fotos'
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
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { FotoLocal } from '@/lib/filaFotos'
import { useEmTela } from '@/lib/useEmTela'
import { cn } from '@/lib/utils'
import { ImagemDeBlob } from './ImagemDeBlob'

/** Uma foto na tela: já salva (`foto`) e/ou ainda na fila do aparelho (`local`). */
export interface FotoExibida {
  id: string
  foto?: Foto
  local?: FotoLocal
}

const ROTULO_STATUS: Record<FotoLocal['status'], string> = {
  preparando: 'Preparando…',
  aguardando: 'Na fila…',
  enviando: 'Enviando…',
  falhou: 'Tentando de novo',
  recusada: 'Não enviada',
}

function FaixaStatus({ local }: { local: FotoLocal }) {
  const comProblema = local.status === 'falhou' || local.status === 'recusada'
  return (
    <span
      className={cn(
        'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg px-1 text-center text-[0.7rem] leading-tight font-medium text-white',
        comProblema ? 'bg-red-900/70' : 'bg-black/50',
      )}
    >
      {comProblema ? <AlertTriangle className="size-5" aria-hidden /> : <Loader2 className="size-5 animate-spin" aria-hidden />}
      {ROTULO_STATUS[local.status]}
    </span>
  )
}

function Miniatura({
  auditoriaId,
  exibida,
  numero,
  onAmpliar,
  onExcluir,
}: {
  auditoriaId: string
  exibida: FotoExibida
  numero: number
  onAmpliar: () => void
  onExcluir?: () => void
}) {
  const { foto, local } = exibida
  const { elemento, emTela } = useEmTela<HTMLDivElement>()
  const imagem = useImagemFoto(auditoriaId, foto, emTela && !local)
  const blob = local?.imagem ?? imagem.data
  const [naoExibe, setNaoExibe] = useState(false)
  const enviando = local?.status === 'enviando'

  return (
    <div ref={elemento} className="relative size-20 shrink-0">
      {imagem.isError && !local ? (
        <button
          type="button"
          onClick={() => void imagem.refetch()}
          aria-label={`Foto ${numero} não carregou. Tentar de novo`}
          className="flex size-full flex-col items-center justify-center gap-1 rounded-lg border bg-muted text-[0.7rem] text-muted-foreground"
        >
          <RotateCw className="size-5" aria-hidden />
          Recarregar
        </button>
      ) : (
        <button
          type="button"
          onClick={onAmpliar}
          aria-label={`Ampliar foto ${numero}${local ? ` (${ROTULO_STATUS[local.status]})` : ''}`}
          className="block size-full overflow-hidden rounded-lg border bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {blob ? (
            <ImagemDeBlob
              blob={blob}
              alt=""
              decoding="async"
              className={cn('size-full object-cover', naoExibe && 'hidden')}
              onError={() => setNaoExibe(true)}
              onLoad={() => setNaoExibe(false)}
            />
          ) : (
            <Skeleton className="size-full" />
          )}
          {/* O original de um HEIC pode não ser exibível no navegador: fica só o ícone. */}
          {naoExibe && <ImageOff className="m-auto size-6 text-muted-foreground" aria-hidden />}
        </button>
      )}
      {local && <FaixaStatus local={local} />}
      {onExcluir && !enviando && (
        <button
          type="button"
          onClick={onExcluir}
          aria-label={`Excluir foto ${numero}`}
          className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-destructive"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}

function TelaCheia({
  auditoriaId,
  exibida,
  numero,
  onFechar,
  onExcluir,
}: {
  auditoriaId: string
  exibida: FotoExibida
  numero: number
  onFechar: () => void
  onExcluir?: () => void
}) {
  const imagem = useImagemFoto(auditoriaId, exibida.foto, !exibida.local)
  const blob = exibida.local?.imagem ?? imagem.data

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent
        aria-describedby={undefined}
        className="h-dvh max-h-none w-screen max-w-none rounded-none bg-black text-white ring-0 [&>button]:text-white [&>button]:hover:bg-white/20"
      >
        <DialogTitle className="sr-only">Foto {numero}</DialogTitle>
        <div className="flex min-h-0 flex-1 items-center justify-center p-2 pt-14">
          {blob ? (
            <ImagemDeBlob blob={blob} alt={`Foto ${numero}`} className="max-h-full max-w-full object-contain" />
          ) : imagem.isError ? (
            <p className="text-sm">Não foi possível carregar a foto.</p>
          ) : (
            <Loader2 className="size-8 animate-spin" aria-label="Carregando foto" />
          )}
        </div>
        {onExcluir && exibida.local?.status !== 'enviando' && (
          <div className="flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button type="button" variant="destructive" size="lg" className="h-12 bg-white/15 px-6 text-base text-white hover:bg-white/25" onClick={onExcluir}>
              <Trash2 aria-hidden />
              Excluir foto
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Miniaturas com tela cheia. Com `editavel`, também excluir (com confirmação) e reenviar o que falhou. */
export function GaleriaFotos({
  auditoriaId,
  itemId,
  fotos,
  editavel = false,
}: {
  auditoriaId: string
  itemId: string
  fotos: FotoExibida[]
  editavel?: boolean
}) {
  const excluir = useExcluirFoto(auditoriaId)
  // Guardam só o id: enquanto a tela está aberta, a foto pode terminar de subir (de local para salva).
  const [ampliadaId, setAmpliadaId] = useState<string | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const indiceAmpliada = fotos.findIndex((f) => f.id === ampliadaId)
  const indiceExcluindo = fotos.findIndex((f) => f.id === excluindoId)
  const comProblema = fotos.filter((f) => f.local?.status === 'falhou' || f.local?.status === 'recusada')

  if (fotos.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-3 pt-2 pr-2" aria-label="Fotos da pergunta">
        {fotos.map((exibida, i) => (
          <li key={exibida.id}>
            <Miniatura
              auditoriaId={auditoriaId}
              exibida={exibida}
              numero={i + 1}
              onAmpliar={() => setAmpliadaId(exibida.id)}
              onExcluir={editavel ? () => setExcluindoId(exibida.id) : undefined}
            />
          </li>
        ))}
      </ul>

      {editavel &&
        comProblema.map(({ id, local }) => (
          <div key={id} role="alert" className="flex flex-wrap items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span className="min-w-0 flex-1">
              Foto {fotos.findIndex((f) => f.id === id) + 1}: {local!.mensagem ?? 'não enviada.'}
              {local!.status === 'falhou' && ' O app segue tentando sozinho.'}
            </span>
            {local!.comprimida && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-10 bg-background text-foreground"
                onClick={() => filaFotos.reenviar(id)}
              >
                <RotateCw aria-hidden />
                Reenviar
              </Button>
            )}
          </div>
        ))}

      {indiceAmpliada >= 0 && (
        <TelaCheia
          auditoriaId={auditoriaId}
          exibida={fotos[indiceAmpliada]}
          numero={indiceAmpliada + 1}
          onFechar={() => setAmpliadaId(null)}
          onExcluir={editavel ? () => setExcluindoId(fotos[indiceAmpliada].id) : undefined}
        />
      )}

      <AlertDialog open={indiceExcluindo >= 0} onOpenChange={(aberta) => !aberta && setExcluindoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta foto?</AlertDialogTitle>
            <AlertDialogDescription>A foto será apagada da auditoria. Isso não pode ser desfeito.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="h-11"
              disabled={excluir.isPending}
              onClick={(e) => {
                e.preventDefault()
                const alvo = fotos[indiceExcluindo]
                if (!alvo) return
                excluir.mutate(
                  { fotoId: alvo.id, itemId, local: alvo.local },
                  {
                    onSuccess: () => {
                      setExcluindoId(null)
                      setAmpliadaId(null)
                    },
                    onError: () => setExcluindoId(null),
                  },
                )
              }}
            >
              {excluir.isPending ? 'Excluindo…' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
