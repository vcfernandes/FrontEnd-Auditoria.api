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
  const url = new URL(caminho, API_URL)
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

async function request<T>(caminho: string, { method = 'GET', params, body, signal }: Opcoes = {}): Promise<T> {
  const token = lerSessao()?.token
  const headers: Record<string, string> = { Accept: 'application/json' }
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
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua internet.')
  }

  if (!resposta.ok) {
    // 401 com token = sessão expirada/inválida. Sem token (ex.: login errado) é só um erro comum.
    if (resposta.status === 401 && token) limparSessao()
    throw await lerErro(resposta)
  }

  if (resposta.status === 204) return undefined as T
  const texto = await resposta.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}

export const api = {
  get: <T>(caminho: string, opcoes?: Omit<Opcoes, 'method' | 'body'>) => request<T>(caminho, opcoes),
  post: <T>(caminho: string, body?: unknown, opcoes?: Omit<Opcoes, 'method' | 'body'>) =>
    request<T>(caminho, { ...opcoes, method: 'POST', body }),
  put: <T>(caminho: string, body?: unknown, opcoes?: Omit<Opcoes, 'method' | 'body'>) =>
    request<T>(caminho, { ...opcoes, method: 'PUT', body }),
  delete: <T = void>(caminho: string, opcoes?: Omit<Opcoes, 'method' | 'body'>) =>
    request<T>(caminho, { ...opcoes, method: 'DELETE' }),
}
