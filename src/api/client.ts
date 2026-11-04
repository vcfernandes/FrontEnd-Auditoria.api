import { toast } from 'sonner'
import { lerSessao, limparSessao } from '@/auth/session'
import type { components } from './schema'

export type Schemas = components['schemas']

const API_URL = import.meta.env.VITE_API_URL

/** Corpo de erro devolvido por todas as rotas da API. */
interface ErroApiCorpo {
  status: number
  mensagem: string
  campos?: Record<string, string>
  timestamp?: string
}

export class ApiError extends Error {
  readonly status: number
  /** Em erros de validação (400): campo → mensagem. */
  readonly campos: Record<string, string>

  constructor(status: number, mensagem: string, campos: Record<string, string> = {}) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.campos = campos
  }
}

type Params = Record<string, string | number | boolean | null | undefined>

interface Opcoes {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Params
  /** `FormData` vai como multipart; qualquer outro valor, como JSON. */
  body?: unknown
  signal?: AbortSignal
  /** Sem o aviso de falta de conexão: para o que roda em segundo plano e tem a própria indicação na tela. */
  semAviso?: boolean
}

/** Base + caminho por concatenação: funciona com base relativa (/api) ou absoluta. */
function montarUrl(caminho: string, params?: Params) {
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') busca.set(chave, String(valor))
  }
  const query = busca.toString()
  return API_URL.replace(/\/$/, '') + caminho + (query ? `?${query}` : '')
}

async function lerErro(resposta: Response): Promise<ApiError> {
  try {
    const corpo = (await resposta.json()) as Partial<ErroApiCorpo>
    return new ApiError(
      resposta.status,
      corpo.mensagem ?? `Erro inesperado (status ${resposta.status}).`,
      corpo.campos ?? {},
    )
  } catch {
    return new ApiError(resposta.status, `Erro inesperado (status ${resposta.status}).`)
  }
}

/** Faz a chamada com token e trata erros no formato da API; devolve a resposta já validada. */
async function executar(
  caminho: string,
  { method = 'GET', params, body, signal, semAviso }: Opcoes,
  accept: string,
): Promise<Response> {
  const token = lerSessao()?.token
  const multipart = body instanceof FormData
  const headers: Record<string, string> = { Accept: accept }
  // No multipart o Content-Type fica por conta do navegador, que precisa incluir o `boundary`.
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let resposta: Response
  try {
    resposta = await fetch(montarUrl(caminho, params), {
      method,
      headers,
      body: multipart ? body : body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro
    const mensagem = 'Não foi possível conectar ao servidor. Verifique sua internet.'
    if (!semAviso) toast.error(mensagem)
    throw new ApiError(0, mensagem)
  }

  if (!resposta.ok) {
    // 401 com token = sessão expirada/inválida. Sem token (ex.: login errado) é só um erro comum.
    if (resposta.status === 401 && token) limparSessao()
    throw await lerErro(resposta)
  }
  return resposta
}

async function request<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const resposta = await executar(caminho, opcoes, 'application/json')
  if (resposta.status === 204) return undefined as T
  const texto = await resposta.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}

/** Extrai o nome do arquivo de `Content-Disposition` (aceita `filename*=UTF-8''...` e `filename="..."`). */
function nomeDoArquivo(disposicao: string | null) {
  if (!disposicao) return null
  const codificado = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(disposicao)
  if (codificado) {
    try {
      return decodeURIComponent(codificado[1].trim().replace(/^"|"$/g, ''))
    } catch {
      // segue para o filename simples
    }
  }
  const simples = /filename\s*=\s*("?)([^";]+)\1/i.exec(disposicao)
  return simples ? simples[2].trim() : null
}

export interface ArquivoBaixado {
  blob: Blob
  /** Nome sugerido pelo servidor (`Content-Disposition`), quando houver. */
  nome: string | null
}

/** Baixa um arquivo autenticado (PDF, foto) como blob — não dá para usar link direto por causa do token. */
async function arquivo(caminho: string, opcoes: Omit<Opcoes, 'method' | 'body'> = {}): Promise<ArquivoBaixado> {
  const resposta = await executar(caminho, opcoes, 'application/pdf, image/*, application/json')
  return { blob: await resposta.blob(), nome: nomeDoArquivo(resposta.headers.get('Content-Disposition')) }
}

export const api = {
  get: <T>(caminho: string, opcoes?: Omit<Opcoes, 'method' | 'body'>) => request<T>(caminho, opcoes),
  post: <T>(caminho: string, body?: unknown, opcoes?: Omit<Opcoes, 'method' | 'body'>) =>
    request<T>(caminho, { ...opcoes, method: 'POST', body }),
  put: <T>(caminho: string, body?: unknown, opcoes?: Omit<Opcoes, 'method' | 'body'>) =>
    request<T>(caminho, { ...opcoes, method: 'PUT', body }),
  delete: <T = void>(caminho: string, opcoes?: Omit<Opcoes, 'method' | 'body'>) =>
    request<T>(caminho, { ...opcoes, method: 'DELETE' }),
  arquivo,
}
