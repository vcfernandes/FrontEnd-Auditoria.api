import { ArrowDown, ArrowRightLeft, ArrowUp, Copy, GripVertical, Trash2 } from 'lucide-react'
import { memo, useRef, useState, type ComponentProps } from 'react'
import { useFormState, type UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAcoesArrasto } from './useArrasto'
import type { DadosModelo } from './formulario'

const PESOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function BotaoIcone({ rotulo, className, ...props }: { rotulo: string } & ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={rotulo}
      title={rotulo}
      className={cn('size-11 text-muted-foreground md:size-9', className)}
      {...props}
    />
  )
}

function MoverParaSecao({
  form,
  secaoAtual,
  onMover,
}: {
  form: UseFormReturn<DadosModelo>
  secaoAtual: number
  onMover: (destino: number) => void
}) {
  // Títulos lidos só ao abrir o menu: assim digitar um título não redesenha todas as perguntas.
  const [secoes, setSecoes] = useState<string[]>([])
  const opcoes = secoes.flatMap((titulo, indice) => (indice === secaoAtual ? [] : [{ titulo, indice }]))

  return (
    <DropdownMenu
      onOpenChange={(aberto) => {
        if (aberto) setSecoes(form.getValues('secoes').map((s) => s.titulo))
      }}
    >
      <DropdownMenuTrigger asChild>
        <BotaoIcone rotulo="Mover para outra seção">
          <ArrowRightLeft aria-hidden />
        </BotaoIcone>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>Mover para</DropdownMenuLabel>
        {opcoes.length === 0 && <p className="px-2 py-2 text-sm text-muted-foreground">Não há outra seção no modelo.</p>}
        {opcoes.map(({ titulo, indice }) => (
          <DropdownMenuItem key={indice} className="min-h-10 cursor-pointer" onSelect={() => onMover(indice)}>
            <span className="truncate">
              {indice + 1}. {titulo.trim() || 'Seção sem título'}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface Props {
  form: UseFormReturn<DadosModelo>
  secao: number
  indice: number
  total: number
  linhaAntes: boolean
  linhaDepois: boolean
  onSubir: (indice: number) => void
  onDescer: (indice: number) => void
  onDuplicar: (indice: number) => void
  onRemover: (indice: number) => void
  onMover: (indice: number, secaoDestino: number) => void
}

/** Com `memo`: digitar não passa pelo React (campos não controlados) e mexer numa pergunta não redesenha as outras. */
export const PerguntaEditor = memo(function PerguntaEditor({
  form,
  secao,
  indice,
  total,
  linhaAntes,
  linhaDepois,
  onSubir,
  onDescer,
  onDuplicar,
  onRemover,
  onMover,
}: Props) {
  const caminho = `secoes.${secao}.perguntas.${indice}` as const
  const { errors } = useFormState({ control: form.control, name: caminho })
  const erros = errors.secoes?.[secao]?.perguntas?.[indice]
  const arrasto = useAcoesArrasto()
  const linha = useRef<HTMLLIElement>(null)
  const numero = `${secao + 1}.${indice + 1}`
  const idBase = `pergunta-${secao}-${indice}`

  return (
    <li
      ref={linha}
      onDragOver={(e) => arrasto.sobrePergunta(e, secao, indice)}
      className="relative flex gap-2 p-3 md:gap-3 md:p-4"
    >
      {linhaAntes && <span aria-hidden className="absolute inset-x-0 -top-px h-0.5 bg-primary" />}
      {linhaDepois && <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}

      <div className="hidden flex-col items-center gap-1 md:flex">
        <div
          draggable
          title="Arraste para mudar a ordem ou a seção"
          onDragStart={(e) => arrasto.iniciar(e, { tipo: 'pergunta', secao, indice }, linha.current)}
          onDragEnd={arrasto.terminar}
          className="flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing pointer-coarse:hidden"
        >
          <GripVertical className="size-4" aria-hidden />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idBase}-texto`} className="text-sm">
            <span className="tabular-nums text-muted-foreground">{numero}</span> Pergunta
          </Label>
          <Textarea
            id={`${idBase}-texto`}
            rows={1}
            placeholder="Ex.: As mãos dos manipuladores estão limpas?"
            className="min-h-11 text-base md:min-h-9 md:text-sm"
            aria-invalid={erros?.texto ? true : undefined}
            aria-describedby={erros?.texto ? `${idBase}-texto-erro` : undefined}
            {...form.register(`${caminho}.texto`)}
          />
          {erros?.texto && (
            <p id={`${idBase}-texto-erro`} className="text-sm text-destructive">
              {erros.texto.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-[6rem_1fr] items-start gap-3 md:grid-cols-[minmax(0,1fr)_5rem_auto]">
          <div className="col-span-2 flex min-w-0 flex-col gap-1.5 md:col-span-1">
            <Label htmlFor={`${idBase}-referencia`} className="text-sm text-muted-foreground">
              Referência legal (opcional)
            </Label>
            <Input
              id={`${idBase}-referencia`}
              autoComplete="off"
              placeholder="Ex.: RDC 216/2004, item 4.6.1"
              className="h-11 text-base md:h-9 md:text-sm"
              aria-invalid={erros?.referenciaLegal ? true : undefined}
              aria-describedby={erros?.referenciaLegal ? `${idBase}-referencia-erro` : undefined}
              {...form.register(`${caminho}.referenciaLegal`)}
            />
            {erros?.referenciaLegal && (
              <p id={`${idBase}-referencia-erro`} className="text-sm text-destructive">
                {erros.referenciaLegal.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idBase}-peso`} className="text-sm text-muted-foreground">
              Peso
            </Label>
            <select
              id={`${idBase}-peso`}
              aria-invalid={erros?.peso ? true : undefined}
              aria-describedby={erros?.peso ? `${idBase}-peso-erro` : undefined}
              className="h-11 w-full rounded-lg border border-input bg-background px-2 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:h-9 md:text-sm"
              {...form.register(`${caminho}.peso`, { valueAsNumber: true })}
            >
              {PESOS.map((peso) => (
                <option key={peso} value={peso}>
                  {peso}
                </option>
              ))}
            </select>
          </div>

          <label className="flex h-11 cursor-pointer items-center gap-2 self-end text-sm font-medium md:h-9">
            <input
              type="checkbox"
              className="size-5 cursor-pointer accent-primary md:size-4"
              {...form.register(`${caminho}.obrigatoria`)}
            />
            Obrigatória
          </label>

          {erros?.peso && (
            <p id={`${idBase}-peso-erro`} className="col-span-full text-sm text-destructive">
              {erros.peso.message}
            </p>
          )}
        </div>

        <div className="-mx-1 -mb-1 flex items-center gap-0.5">
          <BotaoIcone rotulo="Subir pergunta" disabled={indice === 0} onClick={() => onSubir(indice)}>
            <ArrowUp aria-hidden />
          </BotaoIcone>
          <BotaoIcone rotulo="Descer pergunta" disabled={indice === total - 1} onClick={() => onDescer(indice)}>
            <ArrowDown aria-hidden />
          </BotaoIcone>
          <MoverParaSecao form={form} secaoAtual={secao} onMover={(destino) => onMover(indice, destino)} />
          <BotaoIcone rotulo="Duplicar pergunta" onClick={() => onDuplicar(indice)}>
            <Copy aria-hidden />
          </BotaoIcone>
          <BotaoIcone
            rotulo="Remover pergunta"
            className="ml-auto hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onRemover(indice)}
          >
            <Trash2 aria-hidden />
          </BotaoIcone>
        </div>
      </div>
    </li>
  )
})

export { BotaoIcone }
