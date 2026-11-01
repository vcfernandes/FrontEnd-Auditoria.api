import { CheckCircle2, ClipboardPlus, Store, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { useAuditoriasRecentes } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { useDashboard } from '@/api/dashboard'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { dataPorExtenso } from '@/lib/formatadores'
import { cn } from '@/lib/utils'
import { CartoesResumo, EsqueletoCartoesResumo } from './CartoesResumo'
import { DistribuicaoClassificacao } from './DistribuicaoClassificacao'
import { ContinuarDeOndeParou, UltimasFinalizadas } from './ListasAuditorias'

function AcoesRapidas() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        to="/auditorias/nova"
        className="flex min-h-16 items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-sm transition-opacity hover:opacity-95 active:opacity-90"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <ClipboardPlus className="size-5" aria-hidden />
        </span>
        <span className="leading-tight font-semibold">Nova auditoria</span>
      </Link>
      <Link
        to="/clientes/novo"
        className="flex min-h-16 items-center gap-3 rounded-xl border border-primary/15 bg-primary-suave px-4 py-3 text-primary transition-colors hover:border-primary/30 active:opacity-90"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <UserPlus className="size-5" aria-hidden />
        </span>
        <span className="leading-tight font-semibold">Novo cliente</span>
      </Link>
    </div>
  )
}

/** Conta nova (sem clientes ou sem nenhuma auditoria): dois passos para começar. */
function PrimeirosPassos({ temCliente }: { temCliente: boolean }) {
  const passos = [
    {
      feito: temCliente,
      titulo: 'Cadastre seu primeiro cliente',
      texto: 'A padaria, o açougue ou o restaurante que você atende.',
      acao: { para: '/clientes/novo', rotulo: 'Cadastrar cliente', icone: Store },
    },
    {
      feito: false,
      titulo: 'Faça sua primeira auditoria',
      texto: 'Escolha o cliente e o checklist (a RDC 216 já vem pronta) e responda no celular.',
      acao: { para: '/auditorias/nova', rotulo: 'Nova auditoria', icone: ClipboardPlus },
    },
  ]
  const atual = passos.findIndex((p) => !p.feito)

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">Boas-vindas ao Auditorias!</h2>
        <p className="text-sm text-muted-foreground">Comece em dois passos. Depois, este painel mostra seu dia a dia.</p>
      </div>
      <ol className="flex flex-col gap-3">
        {passos.map((passo, i) => (
          <li
            key={passo.titulo}
            className={cn(
              'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center',
              i === atual ? 'border-primary/30 bg-primary-suave/40' : 'bg-muted/40',
            )}
          >
            <div className="flex flex-1 items-start gap-3">
              {passo.feito ? (
                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" aria-label="Feito" />
              ) : (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {i + 1}
                </span>
              )}
              <div>
                <p className={cn('font-medium', passo.feito && 'text-muted-foreground line-through')}>{passo.titulo}</p>
                {!passo.feito && <p className="text-sm text-muted-foreground">{passo.texto}</p>}
              </div>
            </div>
            {!passo.feito && (
              <Button asChild size="lg" variant={i === atual ? 'default' : 'outline'} className="h-11 sm:w-auto">
                <Link to={passo.acao.para}>
                  <passo.acao.icone aria-hidden />
                  {passo.acao.rotulo}
                </Link>
              </Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function InicioPage() {
  const { sessao } = useAuth()
  const dashboard = useDashboard()
  // Usada para saber se a conta já teve alguma auditoria finalizada (o painel só olha os últimos 90 dias).
  const finalizadas = useAuditoriasRecentes('FINALIZADA', 5)

  const primeiroNome = sessao?.usuario.nome.trim().split(/\s+/)[0] ?? ''
  const dados = dashboard.data
  const contaNova =
    !!dados &&
    finalizadas.isSuccess &&
    ((dados.clientesAtivos ?? 0) === 0 ||
      ((dados.auditoriasEmAndamento ?? 0) === 0 && (finalizadas.data.content ?? []).length === 0))

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">Início</h1>

      <div>
        <p className="text-2xl font-semibold">Olá, {primeiroNome}!</p>
        <p className="text-sm text-muted-foreground">{dataPorExtenso()}</p>
      </div>

      {dashboard.isPending && <EsqueletoCartoesResumo />}
      {dashboard.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-card p-4">
          <p className="text-sm text-destructive">
            {dashboard.error instanceof ApiError ? dashboard.error.message : 'Não foi possível carregar o resumo.'}
          </p>
          <Button variant="outline" size="lg" className="h-10" onClick={() => dashboard.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}
      {dados && <CartoesResumo dados={dados} />}

      {contaNova ? <PrimeirosPassos temCliente={(dados?.clientesAtivos ?? 0) > 0} /> : <AcoesRapidas />}

      {/* grid-cols-1 + min-w-0: sem isso a coluna cresce com o texto e os nomes não são cortados no celular */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <ContinuarDeOndeParou mostrarAcao={!contaNova} />
          {dados && <DistribuicaoClassificacao dados={dados} />}
        </div>
        <div className="min-w-0">
          <UltimasFinalizadas />
        </div>
      </div>
    </section>
  )
}
