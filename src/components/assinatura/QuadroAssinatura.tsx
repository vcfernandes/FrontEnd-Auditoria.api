import { Eraser, Loader2, ScreenShare } from 'lucide-react'
import SignaturePad from 'signature_pad'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { recortarAssinatura } from '@/lib/recortarAssinatura'

interface Props {
  /** Quem assina, para o cabeçalho (ex.: "Auditor · Maria"). */
  quem: string
  /** Recebe o PNG já recortado (fundo transparente). */
  onConfirmar: (imagem: Blob) => void
  onCancelar: () => void
  enviando?: boolean
  erro?: string | null
}

/**
 * Quadro de assinatura em tela cheia. O canvas usa `touch-action: none` e o diálogo trava a rolagem da página,
 * então arrastar o dedo só desenha. Mantém o traço se a tela girar ou mudar de tamanho.
 */
export function QuadroAssinatura({ quem, onConfirmar, onCancelar, enviando = false, erro }: Props) {
  const area = useRef<HTMLDivElement | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const pad = useRef<SignaturePad | null>(null)
  // O conteúdo do diálogo só entra no DOM depois do primeiro render (Portal): o efeito espera as duas referências.
  const [montado, setMontado] = useState(false)
  const ancorar = useCallback(() => setMontado(!!area.current && !!canvas.current), [])
  const refArea = useCallback(
    (el: HTMLDivElement | null) => {
      area.current = el
      ancorar()
    },
    [ancorar],
  )
  const refCanvas = useCallback(
    (el: HTMLCanvasElement | null) => {
      canvas.current = el
      ancorar()
    },
    [ancorar],
  )
  const [temTraco, setTemTraco] = useState(false)
  const [semTraco, setSemTraco] = useState(false)

  useEffect(() => {
    const elemento = canvas.current
    const caixa = area.current
    if (!montado || !elemento || !caixa) return

    const assinatura = new SignaturePad(elemento, { penColor: '#0f172a', minWidth: 1, maxWidth: 3.2 })
    pad.current = assinatura
    assinatura.addEventListener('endStroke', () => {
      setTemTraco(!assinatura.isEmpty())
      setSemTraco(false)
    })

    // Ajusta a resolução do canvas ao tamanho na tela (e à densidade de pixels) sem perder o traço.
    const ajustar = () => {
      const razao = Math.max(window.devicePixelRatio || 1, 1)
      const largura = caixa.clientWidth
      const altura = caixa.clientHeight
      if (largura === 0 || altura === 0) return
      const traco = assinatura.toData()
      elemento.width = Math.round(largura * razao)
      elemento.height = Math.round(altura * razao)
      elemento.style.width = `${largura}px`
      elemento.style.height = `${altura}px`
      elemento.getContext('2d')?.scale(razao, razao)
      assinatura.clear()
      if (traco.length > 0) assinatura.fromData(traco)
    }
    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(caixa)

    return () => {
      observador.disconnect()
      assinatura.off()
      pad.current = null
    }
  }, [montado])

  const limpar = () => {
    pad.current?.clear()
    setTemTraco(false)
  }

  const confirmar = async () => {
    if (!canvas.current || !pad.current || pad.current.isEmpty()) {
      setSemTraco(true)
      return
    }
    const imagem = await recortarAssinatura(canvas.current)
    if (!imagem) {
      setSemTraco(true)
      return
    }
    onConfirmar(imagem)
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && !enviando && onCancelar()}>
      <DialogContent
        aria-describedby="quadro-assinatura-ajuda"
        onInteractOutside={(e) => e.preventDefault()}
        className="h-dvh max-h-none w-screen max-w-none rounded-none"
      >
        <div className="flex shrink-0 flex-col gap-1 p-3 pt-4 pr-16">
          <DialogTitle className="truncate text-base font-semibold">Assinatura · {quem}</DialogTitle>
          <DialogDescription id="quadro-assinatura-ajuda" className="text-sm text-muted-foreground">
            Assine com o dedo ou a caneta dentro do quadro.
          </DialogDescription>
          <p className="hidden items-center gap-1.5 text-sm text-muted-foreground [@media(orientation:portrait)_and_(pointer:coarse)]:flex">
            <ScreenShare className="size-4 shrink-0" aria-hidden />
            Dica: deite o celular para ter mais espaço.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3">
          <div
            ref={refArea}
            className="relative min-h-40 flex-1 overflow-hidden rounded-xl border-2 border-dashed border-input bg-white"
          >
            <canvas ref={refCanvas} aria-label="Quadro de assinatura" className="block touch-none select-none" />
            <span className="pointer-events-none absolute inset-x-6 bottom-9 border-b border-slate-300" aria-hidden />
            <span className="pointer-events-none absolute bottom-2 left-6 text-xs text-slate-400" aria-hidden>
              Assine acima da linha
            </span>
          </div>
          {(semTraco || erro) && (
            <p role="alert" className="pt-2 text-sm text-destructive">
              {erro ?? 'Faça a assinatura antes de confirmar.'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Button type="button" variant="outline" size="lg" className="h-12 text-base" onClick={limpar} disabled={enviando || !temTraco}>
            <Eraser aria-hidden />
            Limpar
          </Button>
          <Button type="button" variant="outline" size="lg" className="h-12 text-base" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="button" size="lg" className="h-12 text-base" onClick={() => void confirmar()} disabled={enviando}>
            {enviando && <Loader2 className="animate-spin" aria-hidden />}
            {enviando ? 'Salvando…' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
