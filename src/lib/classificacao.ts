export type Classificacao = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'INADEQUADO'

interface Estilo {
  rotulo: string
  /** Etiqueta (fundo + texto). */
  classes: string
  /** Só a cor de fundo (barras, bolinhas de legenda). */
  barra: string
  /** Texto colorido legível sobre fundo branco (ex.: nota média). */
  texto: string
}

export const CLASSIFICACOES: Record<Classificacao, Estilo> = {
  EXCELENTE: { rotulo: 'Excelente', classes: 'bg-emerald-600 text-white', barra: 'bg-emerald-600', texto: 'text-emerald-700' },
  // Azul-celeste, bem mais claro que o azul-marinho do tema, para não se confundir com ele.
  BOM: { rotulo: 'Bom', classes: 'bg-sky-500 text-white', barra: 'bg-sky-500', texto: 'text-sky-600' },
  REGULAR: { rotulo: 'Regular', classes: 'bg-amber-400 text-amber-950', barra: 'bg-amber-400', texto: 'text-amber-600' },
  INADEQUADO: { rotulo: 'Inadequado', classes: 'bg-red-600 text-white', barra: 'bg-red-600', texto: 'text-red-600' },
}

/** Da melhor para a pior (ordem da legenda e da barra de distribuição). */
export const ORDEM_CLASSIFICACOES: Classificacao[] = ['EXCELENTE', 'BOM', 'REGULAR', 'INADEQUADO']

/**
 * Faixa de uma nota — mesmas regras de `CalculadoraNota.classificar` no backend:
 * ≥ 90 Excelente, ≥ 75 Bom, ≥ 60 Regular, abaixo Inadequado.
 * Usada onde a API devolve só a nota (ex.: nota média do painel).
 */
export function classificarNota(nota: number): Classificacao {
  if (nota >= 90) return 'EXCELENTE'
  if (nota >= 75) return 'BOM'
  if (nota >= 60) return 'REGULAR'
  return 'INADEQUADO'
}
