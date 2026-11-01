import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  /** Começa em 0. */
  pagina: number
  totalPaginas: number
  totalItens: number
  tamanhoPagina: number
  itensNaPagina: number
  /** Ex.: ['auditoria', 'auditorias']. */
  nome: [string, string]
  onMudar: (pagina: number) => void
}

/** "Mostrando 21–40 de 57 auditorias" + Anterior / Próxima. */
export function Paginacao({ pagina, totalPaginas, totalItens, tamanhoPagina, itensNaPagina, nome, onMudar }: Props) {
  const inicio = pagina * tamanhoPagina + 1
  const fim = pagina * tamanhoPagina + itensNaPagina

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground tabular-nums">
        Mostrando {inicio === fim ? inicio : `${inicio}–${fim}`} de {totalItens} {totalItens === 1 ? nome[0] : nome[1]}
      </p>
      {totalPaginas > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-11"
            disabled={pagina === 0}
            onClick={() => onMudar(pagina - 1)}
          >
            <ChevronLeft aria-hidden />
            Anterior
          </Button>
          <span className="px-1 text-sm whitespace-nowrap text-muted-foreground tabular-nums">
            {pagina + 1} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="lg"
            className="h-11"
            disabled={pagina + 1 >= totalPaginas}
            onClick={() => onMudar(pagina + 1)}
          >
            Próxima
            <ChevronRight aria-hidden />
          </Button>
        </div>
      )}
    </div>
  )
}
