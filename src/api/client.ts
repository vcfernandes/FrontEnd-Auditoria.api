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
  body?: unknown
  signal?: AbortSignal
}

function montarUrl(caminho: string, params?: Params) {
  // API_URL pode ser relativa (/api, via proxy do Vite) ou absoluta.
  const url = new URL(API_URL.replace(/\/$/, '') + caminho, window.location.origin)
  for (const [chave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') {
      url.searchParams.set(chave, String(valor))
    }
  }
  return url
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
  { method = 'GET', params, body, signal }: Opcoes,
  accept: string,
): Promise<Response> {
  const token = lerSessao()?.token
  const headers: Record<string, string> = { Accept: accept }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let resposta: Response
  try {
    resposta = await fetch(montarUrl(caminho, params), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro
    const mensagem = 'Não foi possível conectar ao servidor. Verifique sua internet.'
    toast.error(mensagem)
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

/** Baixa um arquivo autenticado (ex.: PDF) como blob — não dá para usar link direto por causa do token. */
async function arquivo(caminho: string, opcoes: Omit<Opcoes, 'method' | 'body'> = {}): Promise<ArquivoBaixado> {
  const resposta = await executar(caminho, opcoes, 'application/pdf, application/json')
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
