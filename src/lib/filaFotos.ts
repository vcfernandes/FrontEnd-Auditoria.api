import { ApiError } from '@/api/client'
import { tentarSozinho } from './filaRespostas'
import { gerarUuid } from './uuid'

/**
 * preparando: comprimindo · aguardando: na fila · enviando · falhou: vai tentar de novo sozinha ·
 * recusada: não adianta repetir sozinho (formato, limite, auditoria finalizada…).
 */
export type StatusFotoLocal = 'preparando' | 'aguardando' | 'enviando' | 'falhou' | 'recusada'

export interface FotoLocal {
  /** Gerado aqui e repetido em toda tentativa: o backend não duplica um id que já recebeu. */
  id: string
  auditoriaId: string
  itemId: string
  imagem: Blob
  comprimida: boolean
  status: StatusFotoLocal
  mensagem: string | null
  /** Já saiu do aparelho ao menos uma vez: pode ter chegado ao servidor mesmo sem resposta. */
  jaTentou: boolean
}

interface Dependencias<Resposta> {
  comprimir: (arquivo: Blob) => Promise<Blob>
  enviar: (foto: FotoLocal, signal: AbortSignal) => Promise<Resposta>
  excluirNoServidor: (foto: FotoLocal) => Promise<void>
  aoEnviar: (foto: FotoLocal, resposta: Resposta) => void
  aoRecusar: (mensagem: string) => void
  aoVencerSessao: () => void
}

const ESPERA_INICIAL_MS = 2_000
const ESPERA_MAX_MS = 30_000
/** Em rede ruim o fetch pode ficar pendurado para sempre; repetir é seguro por causa do id. */
const TEMPO_MAXIMO_ENVIO_MS = 120_000
const SEM_FOTOS: FotoLocal[] = []

/**
 * Fila de fotos (sem React), que vive enquanto o app estiver aberto: comprime uma por vez e envia uma por vez,
 * em segundo plano, inclusive se o usuário sair da tela. Só em memória: fechar o app perde o que não subiu.
 */
export class FilaFotos<Resposta> {
  private fotos: FotoLocal[] = []
  private porItem = new Map<string, FotoLocal[]>()
  private readonly ouvintes = new Set<() => void>()
  private compressoes: Promise<void> = Promise.resolve()
  private processando = false
  private pausada = false
  private timer: ReturnType<typeof setTimeout> | undefined
  private falhasSeguidas = 0
  private readonly dep: Dependencias<Resposta>

  constructor(dep: Dependencias<Resposta>) {
    this.dep = dep
  }

  assinar = (ouvinte: () => void) => {
    this.ouvintes.add(ouvinte)
    return () => {
      this.ouvintes.delete(ouvinte)
    }
  }

  /** Mesma referência enquanto a pergunta não mudar: mexer numa foto não redesenha as outras perguntas. */
  doItem = (itemId: string) => this.porItem.get(itemId) ?? SEM_FOTOS

  pendentes = (auditoriaId: string) => this.fotos.filter((f) => f.auditoriaId === auditoriaId).length

  temPendentes = () => this.fotos.length > 0

  /** Fotos que ainda não subiram, na ordem em que foram tiradas. */
  daAuditoria = (auditoriaId: string) => this.fotos.filter((f) => f.auditoriaId === auditoriaId)

  adicionar(auditoriaId: string, itemId: string, arquivo: Blob) {
    const id = gerarUuid()
    this.fotos = [
      ...this.fotos,
      { id, auditoriaId, itemId, imagem: arquivo, comprimida: false, status: 'preparando', mensagem: null, jaTentou: false },
    ]
    this.publicar(itemId)
    this.agendarCompressao(id)
    return id
  }

  /** Botão "Reenviar": tenta já, sem esperar o próximo intervalo. */
  reenviar(id: string) {
    const foto = this.buscar(id)
    if (!foto || foto.status === 'enviando' || !foto.comprimida) return
    this.atualizar(id, { status: 'aguardando', mensagem: null })
    this.falhasSeguidas = 0
    void this.processar()
  }

  /** A rede voltou ou o usuário quer finalizar: as que falharam tentam já. As recusadas ficam como estão. */
  tentarDeNovo(auditoriaId?: string) {
    if (this.pausada) return
    for (const foto of this.fotos) {
      if (foto.status === 'falhou' && (!auditoriaId || foto.auditoriaId === auditoriaId)) {
        this.atualizar(foto.id, { status: 'aguardando', mensagem: null })
      }
    }
    this.falhasSeguidas = 0
    void this.processar()
  }

  /** Tira da fila. Se a foto chegar ao servidor mesmo assim, o envio em curso a apaga ao terminar. */
  remover(id: string) {
    const foto = this.buscar(id)
    if (!foto) return
    this.fotos = this.fotos.filter((f) => f.id !== id)
    this.publicar(foto.itemId)
  }

  /** Sessão vencida ou encerrada: nada sai até entrar de novo. */
  pausar() {
    this.pausada = true
    clearTimeout(this.timer)
  }

  retomar() {
    this.pausada = false
    this.tentarDeNovo()
  }

  /** Outro usuário entrou no aparelho: as fotos do anterior não podem subir com o acesso dele. */
  esvaziar() {
    const itens = new Set(this.fotos.map((f) => f.itemId))
    this.fotos = []
    itens.forEach((itemId) => this.publicar(itemId))
  }

  /**
   * Espera a fila da auditoria acabar. `true`: subiu tudo. `false`: alguma falhou ou foi recusada
   * (o envio segue sozinho, mas não adianta deixar o usuário esperando sem saber).
   */
  aguardar(auditoriaId: string) {
    return new Promise<boolean>((resolver) => {
      const verificar = () => {
        const minhas = this.daAuditoria(auditoriaId)
        const terminou = minhas.length === 0
        if (!terminou && !minhas.some((f) => f.status === 'falhou' || f.status === 'recusada')) return
        cancelar()
        resolver(terminou)
      }
      const cancelar = this.assinar(verificar)
      verificar()
    })
  }

  private agendarCompressao(id: string) {
    this.compressoes = this.compressoes.then(() => this.comprimir(id))
  }

  private async comprimir(id: string) {
    const foto = this.buscar(id)
    if (!foto) return
    try {
      const imagem = await this.dep.comprimir(foto.imagem)
      if (!this.buscar(id)) return
      this.atualizar(id, { imagem, comprimida: true, status: 'aguardando' })
      void this.processar()
    } catch {
      const mensagem = 'Não foi possível ler esta imagem. Use uma foto JPEG, PNG ou WebP.'
      if (!this.buscar(id)) return
      this.atualizar(id, { status: 'recusada', mensagem })
      this.dep.aoRecusar(mensagem)
    }
  }

  private async processar() {
    if (this.processando || this.pausada) return
    clearTimeout(this.timer)
    this.processando = true
    try {
      for (;;) {
        // Uma por vez: a trava do backend já serializa os envios da auditoria, e em rede ruim é o que sobra de banda.
        const foto = this.fotos.find((f) => f.status === 'aguardando' || f.status === 'falhou')
        if (!foto || !(await this.enviarUma(foto))) return
      }
    } finally {
      this.processando = false
    }
  }

  /** Devolve `false` quando a fila deve parar (rede fora ou sessão vencida). */
  private async enviarUma(foto: FotoLocal) {
    this.atualizar(foto.id, { status: 'enviando', mensagem: null, jaTentou: true })
    const controle = new AbortController()
    const limite = setTimeout(() => controle.abort(), TEMPO_MAXIMO_ENVIO_MS)
    try {
      const resposta = await this.dep.enviar(foto, controle.signal)
      this.falhasSeguidas = 0
      if (this.buscar(foto.id)) {
        this.dep.aoEnviar(foto, resposta)
        this.remover(foto.id)
      } else {
        // Excluída enquanto subia: não pode ficar no servidor.
        void this.dep.excluirNoServidor(foto).catch(() => undefined)
      }
      return true
    } catch (erro) {
      if (!this.buscar(foto.id)) return true
      if (erro instanceof ApiError && erro.status === 401) {
        this.atualizar(foto.id, { status: 'falhou', mensagem: 'Sessão vencida.' })
        this.pausar()
        this.dep.aoVencerSessao()
        return false
      }
      if (tentarSozinho(erro)) {
        const semRede = !(erro instanceof ApiError) || erro.status === 0
        this.atualizar(foto.id, { status: 'falhou', mensagem: semRede ? 'Sem conexão.' : (erro as ApiError).message })
        this.falhasSeguidas++
        const espera = Math.min(ESPERA_MAX_MS, ESPERA_INICIAL_MS * 2 ** (this.falhasSeguidas - 1))
        this.timer = setTimeout(() => void this.processar(), espera)
        return false
      }
      const mensagem = erro instanceof ApiError ? erro.message : 'A foto não foi aceita.'
      this.atualizar(foto.id, { status: 'recusada', mensagem })
      this.dep.aoRecusar(mensagem)
      return true
    } finally {
      clearTimeout(limite)
    }
  }

  private buscar(id: string) {
    return this.fotos.find((f) => f.id === id)
  }

  private atualizar(id: string, parcial: Partial<FotoLocal>) {
    const foto = this.buscar(id)
    if (!foto) return
    this.fotos = this.fotos.map((f) => (f.id === id ? { ...f, ...parcial } : f))
    this.publicar(foto.itemId)
  }

  private publicar(itemId: string) {
    const doItem = this.fotos.filter((f) => f.itemId === itemId)
    if (doItem.length > 0) this.porItem.set(itemId, doItem)
    else this.porItem.delete(itemId)
    this.ouvintes.forEach((ouvinte) => ouvinte())
  }
}
