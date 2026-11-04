import { PenLine, RotateCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  ROTULO_PAPEL,
  useAssinar,
  useImagemAssinatura,
  useRemoverAssinatura,
  type Assinatura,
  type PapelAssinatura,
} from '@/api/assinaturas'
import type { Auditoria } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/useAuth'
import { QuadroAssinatura } from '@/components/assinatura/QuadroAssinatura'
import { ImagemDeBlob } from '@/components/fotos/ImagemDeBlob'
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
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarDataHora } from '@/lib/formatadores'

function mensagemDe(falha: unknown, padrao: string) {
  return falha instanceof ApiError ? falha.message : padrao
}

function Miniatura({ auditoriaId, assinatura }: { auditoriaId: string; assinatura: Assinatura }) {
  const imagem = useImagemAssinatura(auditoriaId, assinatura)
  return (
    <div className="flex h-24 items-center justify-center rounded-lg border bg-white p-2">
      {imagem.data ? (
        <ImagemDeBlob blob={imagem.data} alt={`Assinatura de ${assinatura.nome}`} className="max-h-full max-w-full object-contain" />
      ) : imagem.isError ? (
        <Button type="button" variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={() => void imagem.refetch()}>
          <RotateCw aria-hidden />
          Recarregar
        </Button>
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  )
}

function CartaoAssinatura({
  auditoriaId,
  papel,
  assinatura,
  nomeSugerido,
  comCargo,
}: {
  auditoriaId: string
  papel: PapelAssinatura
  assinatura?: Assinatura
  nomeSugerido: string
  comCargo: boolean
}) {
  const assinar = useAssinar(auditoriaId, papel)
  const remover = useRemoverAssinatura(auditoriaId, papel)
  const [refazendo, setRefazendo] = useState(false)
  const [nome, setNome] = useState(assinatura?.nome ?? nomeSugerido)
  const [cargo, setCargo] = useState(assinatura?.cargo ?? '')
  const [quadroAberto, setQuadroAberto] = useState(false)
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const salva = assinatura && !refazendo
  const rotulo = ROTULO_PAPEL[papel]
  const idNome = `assinatura-${papel}-nome`
  const idCargo = `assinatura-${papel}-cargo`

  const refazer = () => {
    setNome(assinatura?.nome ?? nomeSugerido)
    setCargo(assinatura?.cargo ?? '')
    setErro(null)
    setRefazendo(true)
  }

  const abrirQuadro = () => {
    if (!nome.trim()) {
      setErro('Informe o nome de quem vai assinar.')
      return
    }
    setErro(null)
    assinar.reset()
    setQuadroAberto(true)
  }

  const confirmar = (imagem: Blob) =>
    assinar.mutate(
      { imagem, nome: nome.trim(), cargo: cargo.trim() },
      {
        onSuccess: () => {
          setQuadroAberto(false)
          setRefazendo(false)
        },
      },
    )

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h3 className="font-medium">{rotulo}</h3>

        {salva ? (
          <>
            <Miniatura auditoriaId={auditoriaId} assinatura={assinatura} />
            <div className="text-sm">
              <p className="font-medium">{assinatura.nome}</p>
              {assinatura.cargo && <p className="text-muted-foreground">{assinatura.cargo}</p>}
              <p className="text-muted-foreground">Assinado em {formatarDataHora(assinatura.assinadoEm)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="lg" className="h-11" onClick={refazer}>
                <PenLine aria-hidden />
                Assinar de novo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 text-destructive"
                disabled={remover.isPending}
                onClick={() => setConfirmandoRemocao(true)}
              >
                <Trash2 aria-hidden />
                Remover
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={idNome}>Nome</Label>
              <Input
                id={idNome}
                className="h-11"
                value={nome}
                maxLength={150}
                autoComplete="off"
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            {comCargo && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={idCargo}>
                  Cargo <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={idCargo}
                  className="h-11"
                  value={cargo}
                  maxLength={100}
                  autoComplete="off"
                  onChange={(e) => setCargo(e.target.value)}
                />
              </div>
            )}
            <div className="grid gap-2" style={{ gridTemplateColumns: assinatura ? '1fr 1fr' : '1fr' }}>
              <Button type="button" size="lg" className="h-12 text-base" onClick={abrirQuadro}>
                <PenLine aria-hidden />
                Assinar
              </Button>
              {assinatura && (
                <Button type="button" variant="outline" size="lg" className="h-12 text-base" onClick={() => setRefazendo(false)}>
                  Cancelar
                </Button>
              )}
            </div>
          </>
        )}

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}
        {remover.isError && (
          <p role="alert" className="text-sm text-destructive">
            {mensagemDe(remover.error, 'Não foi possível remover a assinatura.')}
          </p>
        )}
      </CardContent>

      {quadroAberto && (
        <QuadroAssinatura
          quem={`${rotulo} · ${nome.trim()}`}
          enviando={assinar.isPending}
          erro={assinar.isError ? mensagemDe(assinar.error, 'Não foi possível salvar a assinatura.') : null}
          onCancelar={() => setQuadroAberto(false)}
          onConfirmar={confirmar}
        />
      )}

      <AlertDialog open={confirmandoRemocao} onOpenChange={setConfirmandoRemocao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover a assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              A assinatura de {assinatura?.nome} será apagada e o relatório sairá com o espaço em branco para assinar no papel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="h-11"
              onClick={() => remover.mutate(undefined, { onSettled: () => setConfirmandoRemocao(false) })}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

/** Assinaturas na tela do auditor e do responsável (só com a auditoria finalizada). */
export function Assinaturas({ auditoria }: { auditoria: Auditoria }) {
  const { sessao } = useAuth()
  const id = auditoria.id!
  const porPapel = (papel: PapelAssinatura) => auditoria.assinaturas?.find((a) => a.papel === papel)

  return (
    <section aria-labelledby="titulo-assinaturas" className="flex flex-col gap-3">
      <div>
        <h2 id="titulo-assinaturas" className="text-lg font-semibold">
          Assinaturas
        </h2>
        <p className="text-sm text-muted-foreground">Opcional. As assinaturas aparecem nos dois relatórios em PDF.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <CartaoAssinatura
          auditoriaId={id}
          papel="AUDITOR"
          assinatura={porPapel('AUDITOR')}
          nomeSugerido={sessao?.usuario.nome ?? ''}
          comCargo={false}
        />
        <CartaoAssinatura auditoriaId={id} papel="RESPONSAVEL" assinatura={porPapel('RESPONSAVEL')} nomeSugerido="" comCargo />
      </div>
    </section>
  )
}
