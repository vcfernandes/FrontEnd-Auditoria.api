import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

/** Botão no topo (computador) e botão flutuante acima da barra do rodapé (celular). */
export function BotaoNovo({ para, rotulo }: { para: string; rotulo: string }) {
  return (
    <>
      <Button asChild size="lg" className="hidden h-11 md:inline-flex">
        <Link to={para}>
          <Plus aria-hidden />
          {rotulo}
        </Link>
      </Button>
      <Link
        to={para}
        aria-label={rotulo}
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden"
      >
        <Plus className="size-7" aria-hidden />
      </Link>
    </>
  )
}
