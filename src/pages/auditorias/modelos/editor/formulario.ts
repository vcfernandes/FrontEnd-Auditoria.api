import type { Path, UseFormSetError } from 'react-hook-form'
import { z } from 'zod'
import type { ModeloDados, ModeloDetalhe } from '@/api/checklists'
import { ApiError } from '@/api/client'
import { caminhoDoCampoApi } from '@/lib/erros'

const MENSAGEM_PESO = 'O peso deve ser de 1 a 10'

/** Mesmos limites do backend (`ChecklistRequest`). */
const esquemaPergunta = z.object({
  /** Só existe em perguntas já salvas; é o que preserva a identidade dela no PUT. */
  id: z.string().optional(),
  texto: z.string().trim().min(1, 'Escreva o texto da pergunta').max(500, 'Máximo de 500 caracteres'),
  peso: z.number(MENSAGEM_PESO).int(MENSAGEM_PESO).min(1, MENSAGEM_PESO).max(10, MENSAGEM_PESO),
  obrigatoria: z.boolean(),
  referenciaLegal: z.string().trim().max(100, 'Máximo de 100 caracteres'),
})

const esquemaSecao = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(1, 'Dê um título para a seção').max(200, 'Máximo de 200 caracteres'),
  perguntas: z.array(esquemaPergunta).min(1, 'Adicione ao menos uma pergunta ou remova a seção'),
})

export const esquemaModelo = z.object({
  nome: z.string().trim().min(1, 'Dê um nome para o modelo').max(150, 'Máximo de 150 caracteres'),
  descricao: z.string().trim().max(1000, 'Máximo de 1000 caracteres'),
  secoes: z.array(esquemaSecao).min(1, 'Adicione ao menos uma seção'),
})

export type DadosModelo = z.infer<typeof esquemaModelo>
export type DadosSecao = DadosModelo['secoes'][number]
export type DadosPergunta = DadosSecao['perguntas'][number]

// Obrigatória por padrão: é o que o backend assume e como vêm os modelos da Biblioteca.
export function novaPergunta(texto = ''): DadosPergunta {
  return { texto, peso: 1, obrigatoria: true, referenciaLegal: '' }
}

export function novaSecao(): DadosSecao {
  return { titulo: '', perguntas: [] }
}

const porOrdem = (a: { ordem?: number }, b: { ordem?: number }) => (a.ordem ?? 0) - (b.ordem ?? 0)

export function paraFormulario(modelo?: ModeloDetalhe): DadosModelo {
  if (!modelo) return { nome: '', descricao: '', secoes: [novaSecao()] }
  return {
    nome: modelo.nome ?? '',
    descricao: modelo.descricao ?? '',
    secoes: [...(modelo.secoes ?? [])].sort(porOrdem).map((secao) => ({
      id: secao.id,
      titulo: secao.titulo ?? '',
      perguntas: [...(secao.perguntas ?? [])].sort(porOrdem).map((pergunta) => ({
        id: pergunta.id,
        texto: pergunta.texto ?? '',
        peso: pergunta.peso ?? 1,
        obrigatoria: pergunta.obrigatoria ?? true,
        referenciaLegal: pergunta.referenciaLegal ?? '',
      })),
    })),
  }
}

/**
 * Corpo do POST/PUT. A ordem dos itens no envio é a ordem salva.
 * `obrigatoria` vai sempre: omitida, o backend assume `true`. Texto opcional omitido apaga o valor salvo.
 */
export function paraCorpo(dados: DadosModelo): ModeloDados {
  return {
    nome: dados.nome,
    descricao: dados.descricao || undefined,
    secoes: dados.secoes.map((secao) => ({
      id: secao.id,
      titulo: secao.titulo,
      perguntas: secao.perguntas.map((pergunta) => ({
        id: pergunta.id,
        texto: pergunta.texto,
        peso: pergunta.peso,
        obrigatoria: pergunta.obrigatoria,
        referenciaLegal: pergunta.referenciaLegal || undefined,
      })),
    })),
  }
}

/** Campos com lugar na tela. Qualquer outro erro vira mensagem geral, para nunca sumir. */
const CAMPO_DA_TELA =
  /^(nome|descricao|secoes|secoes\.\d+\.(titulo|perguntas)|secoes\.\d+\.perguntas\.\d+\.(texto|peso|referenciaLegal))$/

/** Coloca os erros da API nos campos; devolve a mensagem geral, se sobrar alguma. */
export function aplicarErrosModelo(erro: unknown, setError: UseFormSetError<DadosModelo>): string | null {
  if (!(erro instanceof ApiError)) return 'Algo deu errado. Tente novamente.'

  const soltas: string[] = []
  let algumCampo = false
  for (const [campo, mensagem] of Object.entries(erro.campos)) {
    const caminho = caminhoDoCampoApi(campo)
    if (CAMPO_DA_TELA.test(caminho)) {
      setError(caminho as Path<DadosModelo>, { type: 'server', message: mensagem })
      algumCampo = true
    } else {
      soltas.push(mensagem)
    }
  }
  if (soltas.length > 0) return soltas.join(' ')
  return algumCampo ? null : erro.message
}

/** Erro de uma lista: vem em `.message` ou `.root.message`, conforme a lista tenha ou não campos na tela. */
export function mensagemDaLista(erro: unknown): string | undefined {
  const lista = erro as { message?: string; root?: { message?: string } } | undefined
  return lista?.message ?? lista?.root?.message
}

/** Texto que identifica o conteúdo editável (sem campos internos): compara versões e decide se há alterações. */
export function assinatura(dados: DadosModelo) {
  return JSON.stringify([
    dados.nome,
    dados.descricao,
    dados.secoes.map((s) => [
      s.id ?? null,
      s.titulo,
      s.perguntas.map((p) => [p.id ?? null, p.texto, p.peso, p.obrigatoria, p.referenciaLegal]),
    ]),
  ])
}

export function contagem(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}
