import { ArrowDown, ArrowUp, ChevronDown, ClipboardPaste, GripVertical, Plus, Trash2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useFieldArray, useFormState, type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ColarPerguntasDialog } from './ColarPerguntasDialog'
import { contagem, mensagemDaLista, novaPergunta, type DadosModelo } from './formulario'
import { BotaoIcone, PerguntaEditor } from './PerguntaEditor'
import { useAcoesArrasto, useAlvoArrasto } from './useArrasto'

interface Props {
  form: UseFormReturn<DadosModelo>
  indice: number
  totalSecoes: number
  aberta: boolean
  onAlternar: () => void
  onMoverSecao: (de: number, para: number) => void
  onRemoverSecao: (indice: number) => void
  onMoverPergunta: (secaoOrigem: number, indiceOrigem: number, secaoDestino: number) => void
}

export function SecaoEditor({
  form,
  indice,
  totalSecoes,
  aberta,
  onAlternar,
  onMoverSecao,
  onRemoverSecao,
  onMoverPergunta,
}: Props) {
  const { control, getValues, register } = form
  // keyName: por padrão o useFieldArray grava a chave interna em `id`, por cima do id que vem da API.
  const { fields, append, insert, move, remove } = useFieldArray({
    control,
    name: `secoes.${indice}.perguntas`,
    keyName: 'chave',
  })
  const { errors } = useFormState({ control, name: `secoes.${indice}` })
  const erroSecao = errors.secoes?.[indice]
  const erroLista = mensagemDaLista(erroSecao?.perguntas)
  const arrasto = useAcoesArrasto()
  const alvo = useAlvoArrasto()
  const bloco = useRef<HTMLElement>(null)
  const [colando, setColando] = useState(false)
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false)

  const onSubir = useCallback((i: number) => move(i, i - 1), [move])
  const onDescer = useCallback((i: number) => move(i, i + 1), [move])
  const onRemover = useCallback((i: number) => remove(i), [remove])
  const onDuplicar = useCallback(
    (i: number) => {
      // A cópia é uma pergunta nova: sem o id da original.
      const { id: _id, ...copia } = getValues(`secoes.${indice}.perguntas.${i}`)
      insert(i + 1, copia)
    },
    [getValues, indice, insert],
  )
  const onMover = useCallback(
    (i: number, destino: number) => onMoverPergunta(indice, i, destino),
    [indice, onMoverPergunta],
  )

  const pedirRemocao = () => {
    if (fields.length === 0) onRemoverSecao(indice)
    else setConfirmandoRemocao(true)
  }

  const criarColadas = (textos: string[]) => {
    append(textos.map((texto) => novaPergunta(texto)), { shouldFocus: false })
    setColando(false)
    toast.success(`${contagem(textos.length, 'pergunta adicionada', 'perguntas adicionadas')}.`)
  }

  const alvoAqui = alvo?.tipo === 'pergunta' && alvo.secao === indice ? alvo.indice : null
  const linhaSecaoAntes = alvo?.tipo === 'secao' && alvo.indice === indice
  const linhaSecaoDepois = alvo?.tipo === 'secao' && alvo.indice === indice + 1 && indice === totalSecoes - 1
  const destacada = alvoAqui !== null && (!aberta || fields.length === 0)
  const titulo = aberta || confirmandoRemocao || colando ? getValues(`secoes.${indice}.titulo`) : ''

  return (
    <section
      ref={bloco}
      id={`secao-${indice}`}
      onDragOver={(e) => arrasto.sobreSecao(e, indice, fields.length)}
      onDrop={arrasto.soltar}
      className={cn(
        'relative scroll-mt-20 rounded-xl border bg-card transition-colors',
        destacada && 'border-primary ring-2 ring-primary/30',
        erroSecao && 'border-destructive/50',
      )}
    >
      {linhaSecaoAntes && <span aria-hidden className="absolute inset-x-0 -top-2 h-1 rounded-full bg-primary" />}
      {linhaSecaoDepois && <span aria-hidden className="absolute inset-x-0 -bottom-2 h-1 rounded-full bg-primary" />}

      <header className="flex flex-col gap-2 p-3 md:flex-row md:items-start md:p-4">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div
            draggable
            title="Arraste para mudar a ordem da seção"
            onDragStart={(e) => arrasto.iniciar(e, { tipo: 'secao', indice }, bloco.current)}
            onDragEnd={arrasto.terminar}
            className="mt-1 hidden size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing md:flex pointer-coarse:hidden"
          >
            <GripVertical className="size-4" aria-hidden />
          </div>
          <span className="mt-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-suave text-sm font-semibold text-primary tabular-nums md:mt-0.5">
            {indice + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Input
              aria-label={`Título da seção ${indice + 1}`}
              autoComplete="off"
              placeholder="Título da seção"
              className="h-11 text-base font-semibold md:h-9 md:text-sm"
              aria-invalid={erroSecao?.titulo ? true : undefined}
              {...register(`secoes.${indice}.titulo`)}
            />
            {erroSecao?.titulo && <p className="text-sm text-destructive">{erroSecao.titulo.message}</p>}
          </div>
        </div>

        <div className="flex items-center gap-0.5 md:shrink-0">
          <span className="mr-auto px-1 text-sm text-muted-foreground tabular-nums md:mr-2 md:leading-9">
            {contagem(fields.length, 'pergunta', 'perguntas')}
          </span>
          <BotaoIcone rotulo="Subir seção" disabled={indice === 0} onClick={() => onMoverSecao(indice, indice - 1)}>
            <ArrowUp aria-hidden />
          </BotaoIcone>
          <BotaoIcone
            rotulo="Descer seção"
            disabled={indice === totalSecoes - 1}
            onClick={() => onMoverSecao(indice, indice + 1)}
          >
            <ArrowDown aria-hidden />
          </BotaoIcone>
          <BotaoIcone
            rotulo="Remover seção"
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={pedirRemocao}
          >
            <Trash2 aria-hidden />
          </BotaoIcone>
          <BotaoIcone
            rotulo={aberta ? 'Recolher perguntas da seção' : 'Mostrar perguntas da seção'}
            aria-expanded={aberta}
            onClick={onAlternar}
          >
            <ChevronDown className={cn('transition-transform', aberta && 'rotate-180')} aria-hidden />
          </BotaoIcone>
        </div>
      </header>

      {!aberta && erroLista && (
        <p data-erro-lista tabIndex={-1} className="px-4 pb-3 text-sm text-destructive outline-none">
          {erroLista}
        </p>
      )}

      {/* Recolhida continua montada: as perguntas seguem registradas no formulário. */}
      <div className={cn('border-t', !aberta && 'hidden')}>
        {fields.length > 0 ? (
          <ol className="divide-y">
            {fields.map((pergunta, i) => (
              <PerguntaEditor
                key={pergunta.chave}
                form={form}
                secao={indice}
                indice={i}
                total={fields.length}
                linhaAntes={alvoAqui === i}
                linhaDepois={alvoAqui === i + 1 && i === fields.length - 1}
                onSubir={onSubir}
                onDescer={onDescer}
                onDuplicar={onDuplicar}
                onRemover={onRemover}
                onMover={onMover}
              />
            ))}
          </ol>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma pergunta nesta seção. Adicione uma ou cole várias de uma vez.
          </p>
        )}

        {erroLista && (
          <p
            data-erro-lista
            tabIndex={-1}
            className="mx-3 mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive outline-none md:mx-4"
          >
            {erroLista}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 border-t bg-muted/30 p-3 md:flex md:p-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 md:h-9"
            onClick={() => append(novaPergunta())}
          >
            <Plus aria-hidden />
            Adicionar pergunta
          </Button>
          <Button type="button" variant="outline" size="lg" className="h-12 md:h-9" onClick={() => setColando(true)}>
            <ClipboardPaste aria-hidden />
            Colar perguntas
          </Button>
        </div>
      </div>

      <ColarPerguntasDialog aberto={colando} tituloSecao={titulo} onAbertoChange={setColando} onCriar={criarColadas} />

      <AlertDialog open={confirmandoRemocao} onOpenChange={setConfirmandoRemocao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {titulo.trim() ? `“${titulo.trim()}”` : 'esta seção'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {contagem(fields.length, 'pergunta será removida', 'perguntas serão removidas')} junto com a seção. Para
              manter alguma, mova para outra seção antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" className="h-11" onClick={() => onRemoverSecao(indice)}>
              Remover seção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
