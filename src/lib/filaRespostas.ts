import { ApiError } from '@/api/client'

export type ValorResposta = 'CONFORME' | 'NAO_CONFORME' | 'NAO_SE_APLICA'

export interface RespostaLocal {
  resposta: ValorResposta | null
  observacao: string
}

/** Item do corpo de PUT /auditorias/{id}/respostas (`null` limpa o valor). */
export interface RespostaEnvio {
  itemId: string
  resposta: ValorResposta | null
  observacao: string | null
}

export type StatusFila = 'ocioso' | 'pendente' | 'salvando' | 'salvo' | 'erro'

export interface EstadoFila {
  status: StatusFila
  mensagem: string | null
}

const ATRASO_MS = 800
const ESPERA_INICIAL_MS = 2_000
const ESPERA_MAX_MS = 30_000

/** Rede fora, timeout ou erro do servidor: vale tentar de novo sozinho. Outros 4xx não. */
export function tentarSozinho(erro: unknown) {
  if (!(erro instanceof ApiError)) return true
  return erro.status === 0 || erro.status >= 500 || erro.status === 408 || erro.status === 429
}

/**
 * Junta as alterações por pergunta e envia em lote depois de uma pausa.
 * Se o envio falhar, o lote volta para a fila (sem sobrescrever alterações mais novas)
 * e é reenviado com espera crescente. Nada é perdido enquanto a tela estiver aberta.
 */
export class FilaRespostas {
  private pendentes = new Map<string, RespostaLocal>()
  private emVoo: Promise<boolean> | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private timerRetentativa: ReturnType<typeof setTimeout> | undefined
  private falhasSeguidas = 0
  private estado: EstadoFila = { status: 'ocioso', mensagem: null }
  private readonly ouvintes = new Set<() => void>()
  private readonly enviarLote: (itens: RespostaEnvio[]) => Promise<void>

  constructor(enviarLote: (itens: RespostaEnvio[]) => Promise<void>) {
    this.enviarLote = enviarLote
  }

  assinar = (ouvinte: () => void) => {
    this.ouvintes.add(ouvinte)
    return () => {
      this.ouvintes.delete(ouvinte)
    }
  }

  obterEstado = () => this.estado

  /** Há algo ainda não confirmado pelo servidor? */
  temAlteracoes() {
    return this.pendentes.size > 0 || this.emVoo !== null
  }

  alterar(itemId: string, valor: RespostaLocal) {
    this.pendentes.set(itemId, valor)
    clearTimeout(this.timerRetentativa)
    clearTimeout(this.timer)
    this.definir({ status: 'pendente', mensagem: null })
    this.timer = setTimeout(() => void this.descarregar(false), ATRASO_MS)
  }

  /** Reenvia já (botão "tentar de novo" ou a rede voltou). */
  tentarDeNovo() {
    if (this.pendentes.size > 0) void this.descarregar(false)
  }

  /** Envia tudo o que falta e espera terminar. Devolve `true` se ficou tudo salvo. */
  salvarAgora() {
    return this.descarregar(true)
  }

  /** Cancela os envios agendados (ao sair da tela). */
  parar() {
    clearTimeout(this.timer)
    clearTimeout(this.timerRetentativa)
  }

  private async descarregar(forcado: boolean): Promise<boolean> {
    clearTimeout(this.timer)
    clearTimeout(this.timerRetentativa)
    while (this.emVoo) await this.emVoo
    if (this.pendentes.size === 0) return true

    const lote = new Map(this.pendentes)
    this.pendentes.clear()
    this.definir({ status: 'salvando', mensagem: null })

    const envio = this.enviarLote(
      [...lote].map(([itemId, v]) => ({
        itemId,
        resposta: v.resposta,
        observacao: v.observacao.trim() || null,
      })),
    ).then(
      () => {
        this.falhasSeguidas = 0
        return true
      },
      (erro: unknown) => {
        for (const [itemId, valor] of lote) {
          if (!this.pendentes.has(itemId)) this.pendentes.set(itemId, valor)
        }
        this.falhar(erro)
        return false
      },
    )
    this.emVoo = envio
    const ok = await envio
    this.emVoo = null

    if (!ok) return false
    if (this.pendentes.size > 0) {
      // Mudou algo durante o envio: quem precisa de tudo salvo agora envia já; senão, o timer de `alterar` cuida.
      if (forcado) return this.descarregar(true)
      this.definir({ status: 'pendente', mensagem: null })
      return true
    }
    this.definir({ status: 'salvo', mensagem: null })
    return true
  }

  private falhar(erro: unknown) {
    this.falhasSeguidas++
    const semRede = !(erro instanceof ApiError) || erro.status === 0
    this.definir({ status: 'erro', mensagem: semRede ? 'Sem conexão com o servidor.' : erro.message })
    if (tentarSozinho(erro)) {
      const espera = Math.min(ESPERA_MAX_MS, ESPERA_INICIAL_MS * 2 ** (this.falhasSeguidas - 1))
      this.timerRetentativa = setTimeout(() => void this.descarregar(false), espera)
    }
  }

  private definir(estado: EstadoFila) {
    this.estado = estado
    this.ouvintes.forEach((ouvinte) => ouvinte())
  }
}
