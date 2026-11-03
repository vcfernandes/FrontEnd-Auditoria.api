import { z } from 'zod'
import type { ModeloDetalhe } from '@/api/checklists'
import { lerSessao } from '@/auth/session'
import { assinatura, paraFormulario, type DadosModelo } from './formulario'

/** Formato salvo no aparelho. Mais frouxo que o do formulário: o rascunho pode estar incompleto (título vazio etc.). */
const esquemaRascunho = z.object({
  salvoEm: z.number(),
  dados: z.object({
    nome: z.string(),
    descricao: z.string(),
    secoes: z.array(
      z.object({
        id: z.string().optional(),
        titulo: z.string(),
        perguntas: z.array(
          z.object({
            id: z.string().optional(),
            texto: z.string(),
            peso: z.number(),
            obrigatoria: z.boolean(),
            referenciaLegal: z.string(),
          }),
        ),
      }),
    ),
  }),
})

export interface Rascunho {
  /** Epoch em ms da última gravação. */
  salvoEm: number
  dados: DadosModelo
}

/** Um rascunho por usuário e por modelo (`novo` para o modelo ainda não criado). */
export function chaveRascunho(modeloId?: string) {
  return `auditoria.rascunho-modelo.${lerSessao()?.usuario.id ?? 'anonimo'}.${modeloId ?? 'novo'}`
}

// localStorage pode lançar erro (modo privado, cheio, bloqueado): sem rascunho o editor continua funcionando.
export function salvarRascunho(chave: string, dados: DadosModelo) {
  try {
    localStorage.setItem(chave, JSON.stringify({ salvoEm: Date.now(), dados }))
  } catch {
    // sem espaço ou bloqueado
  }
}

export function apagarRascunho(chave: string) {
  try {
    localStorage.removeItem(chave)
  } catch {
    // bloqueado
  }
}

/**
 * Rascunho que vale oferecer: gravado depois da última versão salva do modelo e diferente dela.
 * Qualquer outro (ilegível, antigo, igual ao salvo) é apagado.
 */
export function rascunhoRecuperavel(chave: string, modelo?: ModeloDetalhe): Rascunho | null {
  let bruto: string | null = null
  try {
    bruto = localStorage.getItem(chave)
  } catch {
    return null
  }
  if (bruto === null) return null

  let rascunho: Rascunho | null = null
  try {
    const lido = esquemaRascunho.safeParse(JSON.parse(bruto))
    if (lido.success) rascunho = lido.data
  } catch {
    // JSON inválido
  }

  const versaoSalva = modelo?.atualizadoEm ? Date.parse(modelo.atualizadoEm) : 0
  const util =
    rascunho !== null &&
    rascunho.salvoEm > (Number.isNaN(versaoSalva) ? 0 : versaoSalva) &&
    assinatura(rascunho.dados) !== assinatura(paraFormulario(modelo))
  if (!util) {
    apagarRascunho(chave)
    return null
  }
  return rascunho
}
