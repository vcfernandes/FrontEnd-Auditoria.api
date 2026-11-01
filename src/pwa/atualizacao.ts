import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

const UMA_HORA_MS = 60 * 60 * 1000

let disponivel = false
const ouvintes = new Set<() => void>()
let atualizarServiceWorker: ((recarregar?: boolean) => Promise<void>) | undefined

/** Registra o service worker. Chamar uma vez, na inicialização. */
export function registrarServiceWorker() {
  // Em `npm run dev` não há service worker (devOptions desligado); o registro vira um no-op.
  atualizarServiceWorker = registerSW({
    onNeedRefresh() {
      disponivel = true
      ouvintes.forEach((ouvinte) => ouvinte())
    },
    onRegisteredSW(_url, registro) {
      // O app fica aberto o dia todo no celular: procura versão nova de hora em hora.
      if (registro) setInterval(() => void registro.update(), UMA_HORA_MS)
    },
  })
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

/** `true` quando há versão nova pronta. A troca só acontece quando o usuário pede (`atualizar`). */
export function useAtualizacaoApp() {
  const novaVersao = useSyncExternalStore(assinar, () => disponivel)
  return { novaVersao, atualizar: () => void atualizarServiceWorker?.(true) }
}
