import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAtualizacaoApp } from './atualizacao'

/**
 * Aviso de versão nova. Fica fixo no topo e só atualiza quando o usuário toca em "Atualizar":
 * recarregar no meio de uma auditoria é decisão dele. Se tiver respostas não salvas, o navegador ainda avisa.
 */
export function AvisoAtualizacao() {
  const { novaVersao, atualizar } = useAtualizacaoApp()
  const [dispensado, setDispensado] = useState(false)

  if (!novaVersao || dispensado) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex justify-center p-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]"
    >
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg">
        <RefreshCw className="size-5 shrink-0" aria-hidden />
        <p className="flex-1 text-sm leading-snug font-medium">Nova versão disponível</p>
        <Button variant="ghost" size="lg" className="h-10" onClick={() => setDispensado(true)}>
          Depois
        </Button>
        <Button size="lg" className="h-10" onClick={atualizar}>
          Atualizar
        </Button>
      </div>
    </div>
  )
}
