import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { BotaoNovo } from '@/components/BotaoNovo'
import { lembrarBusca } from '@/lib/ultimaLista'
import { cn } from '@/lib/utils'
import { AbaModelos } from './modelos/AbaModelos'
import { AbaRealizadas } from './realizadas/AbaRealizadas'

type Aba = 'realizadas' | 'modelos' | 'biblioteca'

/** `?aba=modelos|biblioteca`; sem o parâmetro = Realizadas. */
const ABAS: { aba: Aba; rotulo: string }[] = [
  { aba: 'realizadas', rotulo: 'Realizadas' },
  { aba: 'modelos', rotulo: 'Meus modelos' },
  { aba: 'biblioteca', rotulo: 'Biblioteca' },
]

export function AuditoriasPage() {
  const [params, setParams] = useSearchParams()
  const { search } = useLocation()
  const aba = ABAS.find((a) => a.aba === params.get('aba'))?.aba ?? 'realizadas'

  // A seta "voltar" das telas de auditoria traz de volta esta aba com os mesmos filtros.
  useEffect(() => {
    lembrarBusca('/auditorias', search)
  }, [search])

  // Os filtros de Realizadas continuam no endereço ao trocar de aba: ao voltar para ela, estão como antes.
  const mudarAba = (nova: Aba) =>
    setParams(
      (atual) => {
        const proximo = new URLSearchParams(atual)
        if (nova === 'realizadas') proximo.delete('aba')
        else proximo.set('aba', nova)
        return proximo
      },
      { replace: true },
    )

  return (
    <section className="flex flex-col gap-4 pb-16 md:pb-0">
      <h1 className="sr-only">Auditorias</h1>

      {/* Abas + "Nova auditoria" (no celular, o botão é o flutuante, sempre visível) */}
      <div className="flex items-center gap-3">
        <div role="tablist" aria-label="Seções" className="grid flex-1 grid-cols-3 gap-1 rounded-xl border bg-secondary p-1 md:max-w-md">
          {ABAS.map((a) => (
            <button
              key={a.aba}
              type="button"
              role="tab"
              aria-selected={a.aba === aba}
              onClick={() => mudarAba(a.aba)}
              className={cn(
                'h-10 rounded-lg px-1 text-sm font-medium transition-colors',
                a.aba === aba ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <BotaoNovo para="/auditorias/nova" rotulo="Nova auditoria" />
        </div>
      </div>

      {aba === 'realizadas' && <AbaRealizadas />}
      {aba !== 'realizadas' && (
        <AbaModelos
          key={aba}
          biblioteca={aba === 'biblioteca'}
          onIrParaBiblioteca={() => mudarAba('biblioteca')}
        />
      )}
    </section>
  )
}
