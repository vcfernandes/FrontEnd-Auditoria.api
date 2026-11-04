import { Camera } from 'lucide-react'
import { useMemo, useRef, type ChangeEvent } from 'react'
import { filaFotos, MAXIMO_FOTOS_POR_PERGUNTA, useFotosDoItem, useFotosLocais } from '@/api/fotos'
import { GaleriaFotos, type FotoExibida } from '@/components/fotos/GaleriaFotos'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PerguntaFotos({
  auditoriaId,
  itemId,
  numero,
  naoConforme,
}: {
  auditoriaId: string
  itemId: string
  numero: string
  naoConforme: boolean
}) {
  const salvas = useFotosDoItem(auditoriaId, itemId)
  const locais = useFotosLocais(itemId)
  const seletor = useRef<HTMLInputElement>(null)

  const fotos = useMemo<FotoExibida[]>(() => {
    // Uma foto cuja resposta se perdeu pode já vir do servidor enquanto ainda está na fila: aparece uma vez só.
    const naFila = new Set(locais.map((l) => l.id))
    return [
      ...salvas.filter((f) => !naFila.has(f.id!)).map((foto) => ({ id: foto.id!, foto })),
      ...locais.map((local) => ({ id: local.id, local })),
    ]
  }, [salvas, locais])

  // A recusada não está no servidor: aparece para o usuário decidir, mas não ocupa vaga.
  const ocupadas = fotos.filter((f) => f.local?.status !== 'recusada').length
  const noLimite = ocupadas >= MAXIMO_FOTOS_POR_PERGUNTA

  const aoEscolher = (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    e.target.value = '' // permite escolher o mesmo arquivo de novo
    if (arquivo && !noLimite) filaFotos.adicionar(auditoriaId, itemId, arquivo)
  }

  return (
    <div className="flex flex-col gap-2">
      <GaleriaFotos auditoriaId={auditoriaId} itemId={itemId} fotos={fotos} editavel />

      {/* `capture`: câmera traseira no celular. O computador ignora e abre a escolha de arquivo. */}
      <input
        ref={seletor}
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden
        className="hidden"
        onChange={aoEscolher}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={noLimite}
          aria-label={`Adicionar foto à pergunta ${numero}`}
          onClick={() => seletor.current?.click()}
          className={cn(
            'h-12 gap-2 px-4 text-sm',
            naoConforme && !noLimite && 'border-2 border-red-600 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800',
          )}
        >
          <Camera className="size-5" aria-hidden />
          Adicionar foto
          {ocupadas > 0 && (
            <span className="tabular-nums opacity-80">
              {ocupadas}/{MAXIMO_FOTOS_POR_PERGUNTA}
            </span>
          )}
        </Button>
        {noLimite && (
          <p role="status" className="text-sm text-muted-foreground">
            Limite de {MAXIMO_FOTOS_POR_PERGUNTA} fotos por pergunta. Exclua uma para adicionar outra.
          </p>
        )}
      </div>
    </div>
  )
}
