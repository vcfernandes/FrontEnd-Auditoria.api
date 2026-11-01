import { PartyPopper } from 'lucide-react'
import type { Auditoria } from '@/api/auditorias'

const porOrdem = (a: { ordem?: number }, b: { ordem?: number }) => (a.ordem ?? 0) - (b.ordem ?? 0)

/** Itens marcados como Não conforme, agrupados por seção (com a mesma numeração da tela de responder). */
export function NaoConformidades({ auditoria }: { auditoria: Auditoria }) {
  const grupos = [...(auditoria.secoes ?? [])]
    .sort(porOrdem)
    .map((secao, s) => ({
      titulo: `${s + 1}. ${secao.titulo ?? ''}`,
      itens: [...(secao.itens ?? [])]
        .sort(porOrdem)
        .map((item, i) => ({ item, numero: `${s + 1}.${i + 1}` }))
        .filter(({ item }) => item.resposta === 'NAO_CONFORME'),
    }))
    .filter((g) => g.itens.length > 0)
  const total = grupos.reduce((soma, g) => soma + g.itens.length, 0)

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        Não conformidades {total > 0 && <span className="text-muted-foreground tabular-nums">({total})</span>}
      </h2>

      {total === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-6 text-center">
          <PartyPopper className="size-8 text-emerald-600" aria-hidden />
          <p className="font-medium">Nenhuma não conformidade!</p>
          <p className="text-sm text-muted-foreground">Todos os itens avaliados estão conformes.</p>
        </div>
      )}

      {grupos.map((grupo) => (
        <div key={grupo.titulo} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{grupo.titulo}</h3>
          <ul className="flex flex-col gap-2">
            {grupo.itens.map(({ item, numero }) => (
              <li key={item.id} className="flex flex-col gap-1.5 rounded-xl border border-l-4 border-l-red-600 bg-card p-4">
                <p className="leading-snug font-medium">
                  <span className="mr-1.5 text-muted-foreground tabular-nums">{numero}</span>
                  {item.texto}
                </p>
                {item.observacao && (
                  <p className="text-sm">
                    <span className="font-medium">Observação:</span> {item.observacao}
                  </p>
                )}
                {item.referenciaLegal && <p className="text-xs text-muted-foreground">{item.referenciaLegal}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
