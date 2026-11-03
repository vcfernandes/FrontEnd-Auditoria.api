import { GripVertical, Loader2 } from 'lucide-react'
import { useRef } from 'react'
import { useFormState, useWatch, type Control } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { comBuscaLembrada } from '@/lib/ultimaLista'
import { cn } from '@/lib/utils'
import { contagem, type DadosModelo } from './formulario'
import { useAcoesArrasto, useAlvoArrasto } from './useArrasto'

interface PropsAcoes {
  salvando: boolean
  novo: boolean
  erroGeral: string | null
  temErros: boolean
}

function Mensagens({ erroGeral, temErros }: Pick<PropsAcoes, 'erroGeral' | 'temErros'>) {
  const texto = erroGeral ?? (temErros ? 'Corrija os campos destacados para salvar.' : null)
  if (!texto) return null
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {texto}
    </p>
  )
}

function BotaoSalvar({ salvando, novo, className }: Pick<PropsAcoes, 'salvando' | 'novo'> & { className?: string }) {
  return (
    <Button type="submit" size="lg" className={cn('h-12 text-base', className)} disabled={salvando}>
      {salvando && <Loader2 className="animate-spin" aria-hidden />}
      {salvando ? 'Salvando…' : novo ? 'Criar modelo' : 'Salvar alterações'}
    </Button>
  )
}

/** Atalho para uma seção na lista lateral; arrastar aqui muda a ordem sem rolar a página. */
function ItemIndice({
  indice,
  titulo,
  quantidade,
  temErro,
  onIr,
}: {
  indice: number
  titulo: string
  quantidade: number
  temErro: boolean
  onIr: (indice: number) => void
}) {
  const arrasto = useAcoesArrasto()
  const alvo = useAlvoArrasto()
  const item = useRef<HTMLLIElement>(null)
  const linhaAntes = alvo?.tipo === 'secao' && alvo.indice === indice
  const linhaDepois = alvo?.tipo === 'secao' && alvo.indice === indice + 1

  return (
    <li
      ref={item}
      onDragOver={(e) => arrasto.sobreSecao(e, indice, quantidade)}
      onDrop={arrasto.soltar}
      className="group relative flex items-center"
    >
      {linhaAntes && <span aria-hidden className="absolute inset-x-0 -top-px h-0.5 bg-primary" />}
      {linhaDepois && <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
      <div
        draggable
        title="Arraste para mudar a ordem da seção"
        onDragStart={(e) => arrasto.iniciar(e, { tipo: 'secao', indice }, item.current)}
        onDragEnd={arrasto.terminar}
        className="flex h-9 w-5 shrink-0 cursor-grab items-center justify-center text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" aria-hidden />
      </div>
      <button
        type="button"
        onClick={() => onIr(indice)}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-left text-sm hover:bg-muted"
      >
        <span className="w-5 shrink-0 text-right text-muted-foreground tabular-nums">{indice + 1}.</span>
        <span className={cn('min-w-0 flex-1 truncate', !titulo.trim() && 'text-muted-foreground italic')}>
          {titulo.trim() || 'Sem título'}
        </span>
        {temErro && <span role="img" aria-label="Com erro" className="size-2 shrink-0 rounded-full bg-destructive" />}
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{quantidade}</span>
      </button>
    </li>
  )
}

function useTotais(control: Control<DadosModelo>) {
  const secoes = useWatch({ control, name: 'secoes' })
  return {
    secoes,
    totalSecoes: secoes.length,
    totalPerguntas: secoes.reduce((soma, secao) => soma + secao.perguntas.length, 0),
  }
}

/** Computador: coluna fixa com totais, índice das seções e salvar. Isolada para só ela redesenhar ao digitar. */
export function PainelLateral({
  control,
  salvando,
  novo,
  erroGeral,
  temErros,
  onIrParaSecao,
}: PropsAcoes & { control: Control<DadosModelo>; onIrParaSecao: (indice: number) => void }) {
  const { secoes, totalSecoes, totalPerguntas } = useTotais(control)
  const { errors } = useFormState({ control, name: 'secoes' })

  return (
    <aside className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] flex-col gap-3 rounded-xl border bg-card p-4 lg:flex">
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/60 p-3">
          <dd className="text-2xl font-semibold tabular-nums">{totalSecoes}</dd>
          <dt className="text-xs text-muted-foreground">{totalSecoes === 1 ? 'seção' : 'seções'}</dt>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <dd className="text-2xl font-semibold tabular-nums">{totalPerguntas}</dd>
          <dt className="text-xs text-muted-foreground">{totalPerguntas === 1 ? 'pergunta' : 'perguntas'}</dt>
        </div>
      </dl>

      {totalSecoes > 0 && (
        <nav aria-label="Seções do modelo" className="-mx-1 min-h-0 flex-1 overflow-y-auto border-y py-2">
          <ol className="flex flex-col px-1">
            {secoes.map((secao, indice) => (
              <ItemIndice
                key={indice}
                indice={indice}
                titulo={secao.titulo}
                quantidade={secao.perguntas.length}
                temErro={!!errors.secoes?.[indice]}
                onIr={onIrParaSecao}
              />
            ))}
          </ol>
        </nav>
      )}

      <Mensagens erroGeral={erroGeral} temErros={temErros} />
      <BotaoSalvar salvando={salvando} novo={novo} />
      <Button asChild variant="outline" size="lg" className="h-11">
        <Link to={comBuscaLembrada('/auditorias')}>Cancelar</Link>
      </Button>
    </aside>
  )
}

/** Celular e tablet: rodapé fixo acima da barra de navegação. */
export function RodapeSalvar({
  control,
  salvando,
  novo,
  erroGeral,
  temErros,
}: PropsAcoes & { control: Control<DadosModelo> }) {
  const { totalSecoes, totalPerguntas } = useTotais(control)
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-60 md:px-8 lg:hidden">
      <div className="flex max-w-4xl flex-col gap-2">
        <Mensagens erroGeral={erroGeral} temErros={temErros} />
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground tabular-nums">
            {contagem(totalSecoes, 'seção', 'seções')}
            <br />
            {contagem(totalPerguntas, 'pergunta', 'perguntas')}
          </p>
          <BotaoSalvar salvando={salvando} novo={novo} className="px-5" />
        </div>
      </div>
    </div>
  )
}
