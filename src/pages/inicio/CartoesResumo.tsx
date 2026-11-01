import { ChevronRight, ClipboardCheck, ClipboardList, Gauge, Store, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Dashboard } from '@/api/dashboard'
import { IconeQuadrado, type TomIcone } from '@/components/IconeQuadrado'
import { Skeleton } from '@/components/ui/skeleton'
import { CLASSIFICACOES, classificarNota, type Classificacao } from '@/lib/classificacao'
import { formatarNota, inicioDoMesIso, inicioDoPeriodoIso } from '@/lib/formatadores'
import { cn } from '@/lib/utils'

const TOM_DA_CLASSIFICACAO: Record<Classificacao, TomIcone> = {
  EXCELENTE: 'sucesso',
  BOM: 'info',
  REGULAR: 'alerta',
  INADEQUADO: 'perigo',
}

function Cartao({
  para,
  icone,
  tom,
  rotulo,
  children,
}: {
  para: string
  icone: LucideIcon
  tom: TomIcone
  rotulo: string
  children: ReactNode
}) {
  return (
    <Link
      to={para}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/40 active:bg-accent/60"
    >
      <div className="flex items-start justify-between">
        <IconeQuadrado icone={icone} tom={tom} />
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex flex-col gap-0.5">
        {children}
        <p className="text-sm leading-snug text-muted-foreground">{rotulo}</p>
      </div>
    </Link>
  )
}

const numero = 'text-3xl leading-none font-semibold tabular-nums'

export function CartoesResumo({ dados }: { dados: Dashboard }) {
  const nota = dados.ultimos90Dias?.notaMedia
  const classificacao = nota !== undefined && nota !== null ? classificarNota(nota) : null
  const estilo = classificacao ? CLASSIFICACOES[classificacao] : null

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Cartao para="/auditorias?status=andamento" icone={ClipboardList} tom="alerta" rotulo="Em andamento">
        <p className={numero}>{dados.auditoriasEmAndamento ?? 0}</p>
      </Cartao>
      <Cartao
        para={`/auditorias?status=finalizadas&de=${inicioDoMesIso()}`}
        icone={ClipboardCheck}
        tom="sucesso"
        rotulo="Finalizadas no mês"
      >
        <p className={numero}>{dados.auditoriasFinalizadasNoMes ?? 0}</p>
      </Cartao>
      <Cartao para="/clientes" icone={Store} tom="primario" rotulo="Clientes ativos">
        <p className={numero}>{dados.clientesAtivos ?? 0}</p>
      </Cartao>
      <Cartao
        para={`/auditorias?status=finalizadas&de=${inicioDoPeriodoIso(90)}`}
        icone={Gauge}
        tom={classificacao ? TOM_DA_CLASSIFICACAO[classificacao] : 'neutro'}
        rotulo="Nota média (90 dias)"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={cn(numero, estilo?.texto ?? 'text-muted-foreground')}>
            {classificacao ? formatarNota(nota) : '—'}
          </p>
          {estilo && (
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', estilo.classes)}>
              {estilo.rotulo}
            </span>
          )}
        </div>
      </Cartao>
    </div>
  )
}

export function EsqueletoCartoesResumo() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy aria-label="Carregando resumo">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
