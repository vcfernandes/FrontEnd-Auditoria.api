import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

function assinar(ouvinte: () => void) {
  window.addEventListener('online', ouvinte)
  window.addEventListener('offline', ouvinte)
  return () => {
    window.removeEventListener('online', ouvinte)
    window.removeEventListener('offline', ouvinte)
  }
}

function useOnline() {
  return useSyncExternalStore(assinar, () => navigator.onLine)
}

/** Faixa no fluxo da página (não cobre o cabeçalho nem o botão de voltar). */
export function AvisoOffline() {
  if (useOnline()) return null

  return (
    <div
      role="status"
      className="flex items-start gap-2 bg-amber-100 px-4 py-2.5 text-sm text-amber-950"
    >
      <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-semibold">Sem internet.</strong> Os dados não carregam e as alterações não são
        salvas até a conexão voltar.
      </p>
    </div>
  )
}
