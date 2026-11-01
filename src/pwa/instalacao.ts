import { useSyncExternalStore } from 'react'

/** Evento do Chrome/Edge/Android que permite abrir o diálogo de instalação por um botão nosso. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let eventoInstalacao: BeforeInstallPromptEvent | null = null
let instalado = false
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((ouvinte) => ouvinte())

const iOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  // iPadOS 13+ se apresenta como Mac
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const emModoApp = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/** Escuta os eventos logo na inicialização: `beforeinstallprompt` costuma disparar antes de a tela Conta abrir. */
export function iniciarEscutaInstalacao() {
  instalado = emModoApp()
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    eventoInstalacao = e as BeforeInstallPromptEvent
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    instalado = true
    eventoInstalacao = null
    avisar()
  })
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export type SituacaoInstalacao = 'instalado' | 'instalavel' | 'ios' | 'indisponivel'

function situacao(): SituacaoInstalacao {
  if (instalado) return 'instalado'
  if (eventoInstalacao) return 'instalavel'
  if (iOS()) return 'ios'
  return 'indisponivel'
}

export function useInstalacao() {
  const estado = useSyncExternalStore(assinar, situacao)

  const instalar = async () => {
    if (!eventoInstalacao) return
    const evento = eventoInstalacao
    // O evento só pode ser usado uma vez.
    eventoInstalacao = null
    avisar()
    await evento.prompt()
    const { outcome } = await evento.userChoice
    if (outcome === 'accepted') {
      instalado = true
      avisar()
    }
  }

  return { estado, instalar }
}
