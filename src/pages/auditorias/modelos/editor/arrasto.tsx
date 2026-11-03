import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { ContextoAcoes, ContextoAlvo, type AcoesArrasto, type Alvo, type Arrasto } from './useArrasto'

const noMeioInferior = (e: DragEvent) => {
  const { top, height } = e.currentTarget.getBoundingClientRect()
  return e.clientY > top + height / 2
}

const mesmoAlvo = (a: Alvo | null, b: Alvo | null) => {
  if (a === null || b === null) return a === b
  if (a.tipo === 'pergunta' && b.tipo === 'pergunta') return a.secao === b.secao && a.indice === b.indice
  return a.tipo === b.tipo && a.indice === b.indice
}

/** Arrastar nativo do navegador (só mouse): no toque ficam os botões de subir e descer. */
export function ProvedorArrasto({
  onMoverSecao,
  onMoverPergunta,
  children,
}: {
  onMoverSecao: (de: number, para: number) => void
  onMoverPergunta: (secaoOrigem: number, indiceOrigem: number, secaoDestino: number, posicao: number) => void
  children: ReactNode
}) {
  const [alvo, setAlvo] = useState<Alvo | null>(null)
  const arrastoRef = useRef<Arrasto | null>(null)
  const alvoRef = useRef<Alvo | null>(null)
  const callbacks = useRef({ onMoverSecao, onMoverPergunta })
  useEffect(() => {
    callbacks.current = { onMoverSecao, onMoverPergunta }
  }, [onMoverSecao, onMoverPergunta])

  const acoes = useMemo<AcoesArrasto>(() => {
    const definirAlvo = (novo: Alvo | null) => {
      if (mesmoAlvo(alvoRef.current, novo)) return
      alvoRef.current = novo
      setAlvo(novo)
    }
    const terminar = () => {
      arrastoRef.current = null
      definirAlvo(null)
    }
    return {
      terminar,
      iniciar: (e, arrasto, imagem) => {
        arrastoRef.current = arrasto
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', '') // o Firefox só começa a arrastar com algum dado
        if (imagem) e.dataTransfer.setDragImage(imagem, 16, 16)
      },
      sobrePergunta: (e, secao, indice) => {
        if (arrastoRef.current?.tipo !== 'pergunta') return
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
        definirAlvo({ tipo: 'pergunta', secao, indice: noMeioInferior(e) ? indice + 1 : indice })
      },
      sobreSecao: (e, secao, totalPerguntas) => {
        const arrasto = arrastoRef.current
        if (!arrasto) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (arrasto.tipo === 'pergunta') definirAlvo({ tipo: 'pergunta', secao, indice: totalPerguntas })
        else definirAlvo({ tipo: 'secao', indice: noMeioInferior(e) ? secao + 1 : secao })
      },
      soltar: (e) => {
        e.preventDefault()
        const arrasto = arrastoRef.current
        const destino = alvoRef.current
        terminar()
        if (!arrasto || !destino) return
        if (arrasto.tipo === 'pergunta' && destino.tipo === 'pergunta') {
          callbacks.current.onMoverPergunta(arrasto.secao, arrasto.indice, destino.secao, destino.indice)
        } else if (arrasto.tipo === 'secao' && destino.tipo === 'secao') {
          const para = destino.indice > arrasto.indice ? destino.indice - 1 : destino.indice
          if (para !== arrasto.indice) callbacks.current.onMoverSecao(arrasto.indice, para)
        }
      },
    }
  }, [])

  return (
    <ContextoAcoes.Provider value={acoes}>
      <ContextoAlvo.Provider value={alvo}>{children}</ContextoAlvo.Provider>
    </ContextoAcoes.Provider>
  )
}
