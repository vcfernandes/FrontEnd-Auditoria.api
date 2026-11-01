export type Classificacao = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'INADEQUADO'

export const CLASSIFICACOES: Record<Classificacao, { rotulo: string; classes: string }> = {
  EXCELENTE: { rotulo: 'Excelente', classes: 'bg-emerald-600 text-white' },
  BOM: { rotulo: 'Bom', classes: 'bg-blue-600 text-white' },
  REGULAR: { rotulo: 'Regular', classes: 'bg-amber-400 text-amber-950' },
  INADEQUADO: { rotulo: 'Inadequado', classes: 'bg-red-600 text-white' },
}
