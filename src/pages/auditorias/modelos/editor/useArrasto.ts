import { createContext, useContext, type DragEvent } from 'react'

/** O que está sendo arrastado. */
export type Arrasto = { tipo: 'pergunta'; secao: number; indice: number } | { tipo: 'secao'; indice: number }

/** Onde vai cair: `indice` é a posição de inserção, antes de retirar o item da origem. */
export type Alvo = { tipo: 'pergunta'; secao: number; indice: number } | { tipo: 'secao'; indice: number }

export interface AcoesArrasto {
  iniciar: (e: DragEvent, arrasto: Arrasto, imagem: Element | null) => void
  terminar: () => void
  /** Pergunta sobre uma linha: cai antes ou depois dela, conforme a metade em que o cursor está. */
  sobrePergunta: (e: DragEvent, secao: number, indice: number) => void
  /** Pergunta sobre a seção (fora das linhas) cai no fim; seção sobre seção cai antes ou depois. */
  sobreSecao: (e: DragEvent, secao: number, totalPerguntas: number) => void
  soltar: (e: DragEvent) => void
}

// Dois contextos: as linhas só precisam das ações (estáveis); quem desenha o indicador lê o alvo.
export const ContextoAcoes = createContext<AcoesArrasto | null>(null)
export const ContextoAlvo = createContext<Alvo | null>(null)

export function useAcoesArrasto() {
  const acoes = useContext(ContextoAcoes)
  if (!acoes) throw new Error('useAcoesArrasto precisa de ProvedorArrasto')
  return acoes
}

export function useAlvoArrasto() {
  return useContext(ContextoAlvo)
}
