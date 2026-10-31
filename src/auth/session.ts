import type { Schemas } from '@/api/client'

export interface Sessao {
  token: string
  /** Momento de expiração do token (epoch em ms). */
  expiraEm: number
  usuario: {
    id: string
    nome: string
    email: string
    papel: string
  }
}

const CHAVE = 'auditoria.sessao'

type Ouvinte = () => void
const ouvintes = new Set<Ouvinte>()

export function lerSessao(): Sessao | null {
  const bruto = localStorage.getItem(CHAVE)
  if (!bruto) return null
  try {
    const sessao = JSON.parse(bruto) as Sessao
    if (Date.now() >= sessao.expiraEm) {
      localStorage.removeItem(CHAVE)
      return null
    }
    return sessao
  } catch {
    localStorage.removeItem(CHAVE)
    return null
  }
}

export function salvarSessao(auth: Schemas['AuthResponse']) {
  const sessao: Sessao = {
    token: auth.token ?? '',
    expiraEm: Date.now() + (auth.expiraEmSegundos ?? 0) * 1000,
    usuario: {
      id: auth.usuarioId ?? '',
      nome: auth.nome ?? '',
      email: auth.email ?? '',
      papel: auth.papel ?? '',
    },
  }
  localStorage.setItem(CHAVE, JSON.stringify(sessao))
  ouvintes.forEach((ouvinte) => ouvinte())
}

export function limparSessao() {
  localStorage.removeItem(CHAVE)
  ouvintes.forEach((ouvinte) => ouvinte())
}

/** Avisa quando a sessão muda (login, logout ou 401). Devolve a função de cancelar. */
export function aoMudarSessao(ouvinte: Ouvinte) {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}
