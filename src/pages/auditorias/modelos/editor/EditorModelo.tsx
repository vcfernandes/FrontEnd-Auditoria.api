import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Plus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { flushSync } from 'react-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { useBlocker, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useSalvarChecklist, type ModeloDetalhe } from '@/api/checklists'
import { ApiError } from '@/api/client'
import { CampoTexto } from '@/components/CampoTexto'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { comBuscaLembrada } from '@/lib/ultimaLista'
import { ProvedorArrasto } from './arrasto'
import {
  aplicarErrosModelo,
  assinatura,
  esquemaModelo,
  mensagemDaLista,
  novaSecao,
  paraCorpo,
  paraFormulario,
  type DadosModelo,
} from './formulario'
import { PainelLateral, RodapeSalvar } from './PainelResumo'
import { apagarRascunho, salvarRascunho } from './rascunho'
import { SecaoEditor } from './SecaoEditor'

/** Espera sem digitar antes de gravar o rascunho no aparelho. */
const ATRASO_RASCUNHO_MS = 1000

const MENSAGEM_SESSAO_VENCIDA =
  'Sua sessão venceu. O rascunho ficou guardado neste aparelho: entre de novo e abra o editor para recuperá-lo.'

/** Acima disso, só a 1ª seção começa aberta (a RDC 216 tem 89 perguntas): o índice lateral leva às outras. */
const LIMITE_TUDO_ABERTO = 30

/** Lista de modelos, mantendo os filtros de Realizadas que estavam no endereço. */
function enderecoMeusModelos() {
  const busca = new URLSearchParams(comBuscaLembrada('/auditorias').split('?')[1] ?? '')
  busca.set('aba', 'modelos')
  return `/auditorias?${busca}`
}

function rolarParaPrimeiroErro() {
  // Espera as seções com erro abrirem e o formulário voltar a ficar habilitado.
  window.setTimeout(() => {
    const alvo = document.querySelector<HTMLElement>(
      '#editor-modelo [aria-invalid="true"], #editor-modelo [data-erro-lista]',
    )
    if (!alvo) return
    alvo.scrollIntoView({ behavior: 'smooth', block: 'center' })
    alvo.focus({ preventScroll: true })
  }, 60)
}

interface Props {
  modelo?: ModeloDetalhe
  /** Chave do rascunho no aparelho (`chaveRascunho`). */
  chave: string
  /** Rascunho que o usuário escolheu recuperar: começa no lugar da versão salva. */
  recuperado?: DadosModelo
}

export function EditorModelo({ modelo, chave, recuperado }: Props) {
  const navigate = useNavigate()
  const salvar = useSalvarChecklist(modelo?.id)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  // Ligado ao salvar com sucesso: a saída para a lista não é "sair sem salvar".
  const [salvo, setSalvo] = useState(false)
  const salvoRef = useRef(false)
  // Versão salva: "há alterações" é diferença para ela (e não para o ponto de partida do formulário, que pode ser o rascunho).
  const [base] = useState(() => assinatura(paraFormulario(modelo)))

  const form = useForm<DadosModelo>({
    resolver: zodResolver(esquemaModelo),
    defaultValues: recuperado ?? paraFormulario(modelo),
    shouldFocusError: false,
  })
  const { control, formState, getValues, handleSubmit, register, setError, setValue, clearErrors, subscribe } = form
  const { errors } = formState
  const temAlteracoes = useCallback(() => assinatura(getValues()) !== base, [getValues, base])
  const temErros = Object.keys(errors).length > 0

  const secoes = useFieldArray({ control, name: 'secoes', keyName: 'chave' })
  const { fields: camposSecoes, move: moverSecaoCampo, remove: removerSecao, append: adicionarSecao } = secoes

  const [fechadas, setFechadas] = useState<Set<string>>(() => {
    const total = getValues('secoes').reduce((soma, secao) => soma + secao.perguntas.length, 0)
    return new Set(total > LIMITE_TUDO_ABERTO ? camposSecoes.slice(1).map((s) => s.chave) : [])
  })

  const abrirSecao = useCallback((chave: string) => {
    setFechadas((atual) => {
      if (!atual.has(chave)) return atual
      const nova = new Set(atual)
      nova.delete(chave)
      return nova
    })
  }, [])

  // Seção com erro nunca fica recolhida: o erro precisa estar à vista.
  const errosSecoes = errors.secoes
  useEffect(() => {
    if (!Array.isArray(errosSecoes)) return
    errosSecoes.forEach((erro, indice) => {
      const chave = camposSecoes[indice]?.chave
      if (erro && chave) abrirSecao(chave)
    })
  }, [errosSecoes, camposSecoes, abrirSecao])

  const moverSecao = useCallback((de: number, para: number) => moverSecaoCampo(de, para), [moverSecaoCampo])

  /** Regrava as listas: é o que move entre seções sem perder o `id`, que faz parte do valor da pergunta. */
  const moverPergunta = useCallback(
    (secaoOrigem: number, indiceOrigem: number, secaoDestino: number, posicao: number) => {
      const origem = [...getValues(`secoes.${secaoOrigem}.perguntas`)]
      const [pergunta] = origem.splice(indiceOrigem, 1)
      if (!pergunta) return

      if (secaoOrigem === secaoDestino) {
        const destino = posicao > indiceOrigem ? posicao - 1 : posicao
        if (destino === indiceOrigem) return
        origem.splice(destino, 0, pergunta)
        setValue(`secoes.${secaoOrigem}.perguntas`, origem, { shouldDirty: true })
        clearErrors(`secoes.${secaoOrigem}.perguntas`)
        return
      }

      const destino = [...getValues(`secoes.${secaoDestino}.perguntas`)]
      destino.splice(posicao, 0, pergunta)
      setValue(`secoes.${secaoOrigem}.perguntas`, origem, { shouldDirty: true })
      setValue(`secoes.${secaoDestino}.perguntas`, destino, { shouldDirty: true })
      // Erros são por posição: nessas duas listas elas mudaram. Quem seguir errado aparece de novo ao salvar.
      clearErrors([`secoes.${secaoOrigem}.perguntas`, `secoes.${secaoDestino}.perguntas`])
      abrirSecao(camposSecoes[secaoDestino].chave)
    },
    [abrirSecao, camposSecoes, clearErrors, getValues, setValue],
  )

  const moverParaOutraSecao = useCallback(
    (secaoOrigem: number, indiceOrigem: number, secaoDestino: number) => {
      const total = getValues(`secoes.${secaoDestino}.perguntas`).length
      const titulo = getValues(`secoes.${secaoDestino}.titulo`).trim()
      moverPergunta(secaoOrigem, indiceOrigem, secaoDestino, total)
      toast.success(`Pergunta movida para ${titulo ? `“${titulo}”` : `a seção ${secaoDestino + 1}`}.`)
    },
    [getValues, moverPergunta],
  )

  const irParaSecao = useCallback(
    (indice: number) => {
      flushSync(() => abrirSecao(camposSecoes[indice].chave))
      document.getElementById(`secao-${indice}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [abrirSecao, camposSecoes],
  )

  const alternarSecao = (chave: string) =>
    setFechadas((atual) => {
      const nova = new Set(atual)
      if (nova.has(chave)) nova.delete(chave)
      else nova.add(chave)
      return nova
    })

  // Rascunho no aparelho: grava um instante depois da última alteração; igual à versão salva, não deixa rascunho.
  const timerRascunho = useRef<number | undefined>(undefined)
  const gravarRascunho = useCallback(() => {
    window.clearTimeout(timerRascunho.current)
    timerRascunho.current = undefined
    const dados = getValues()
    if (assinatura(dados) === base) apagarRascunho(chave)
    else salvarRascunho(chave, dados)
  }, [getValues, base, chave])

  useEffect(() => {
    // `subscribe` (e não `watch`): ouve as mudanças sem redesenhar o editor a cada tecla.
    const cancelar = subscribe({
      formState: { values: true },
      callback: () => {
        window.clearTimeout(timerRascunho.current)
        timerRascunho.current = window.setTimeout(gravarRascunho, ATRASO_RASCUNHO_MS)
      },
    })
    // Aba escondida ou fechando: não dá para esperar o atraso.
    const gravarSeHouverPendente = () => {
      if (timerRascunho.current !== undefined) gravarRascunho()
    }
    const aoMudarVisibilidade = () => {
      if (document.hidden) gravarSeHouverPendente()
    }
    window.addEventListener('pagehide', gravarSeHouverPendente)
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => {
      cancelar()
      window.removeEventListener('pagehide', gravarSeHouverPendente)
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
      // Saindo da tela (inclusive "sair sem salvar"): o que estava pendente vai para o rascunho, salvo se acabou de ser salvo.
      if (timerRascunho.current !== undefined) {
        if (salvoRef.current) window.clearTimeout(timerRascunho.current)
        else gravarRascunho()
      }
    }
  }, [subscribe, gravarRascunho])

  useEffect(() => {
    salvoRef.current = salvo
  }, [salvo])

  const enviar = (e: FormEvent<HTMLFormElement>) =>
    handleSubmit(
    (dados) => {
      setErroGeral(null)
      // Garante o rascunho antes de enviar: se a sessão tiver vencido, é ele que sobra.
      gravarRascunho()
      salvar.mutate(paraCorpo(dados), {
        onSuccess: () => {
          apagarRascunho(chave)
          setSalvo(true)
        },
        onError: (erro) => {
          if (erro instanceof ApiError && erro.status === 401) setErroGeral(MENSAGEM_SESSAO_VENCIDA)
          else setErroGeral(aplicarErrosModelo(erro, setError))
          rolarParaPrimeiroErro()
        },
      })
    },
    () => {
      setErroGeral(null)
      rolarParaPrimeiroErro()
    },
  )(e)

  // Enter num campo de uma linha não pode salvar e sair da tela sem querer.
  const ignorarEnter = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) e.preventDefault()
  }

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !salvo && currentLocation.pathname !== nextLocation.pathname && temAlteracoes(),
  )

  // Depois do useBlocker: quando este efeito roda, o bloqueio já enxerga `salvo`.
  useEffect(() => {
    if (salvo) navigate(enderecoMeusModelos(), { replace: true })
  }, [salvo, navigate])

  useEffect(() => {
    if (salvo) return
    const avisar = (e: BeforeUnloadEvent) => {
      if (temAlteracoes()) e.preventDefault()
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [salvo, temAlteracoes])

  const novo = !modelo
  const erroListaSecoes = mensagemDaLista(errors.secoes)

  return (
    <ProvedorArrasto onMoverSecao={moverSecao} onMoverPergunta={moverPergunta}>
      <form id="editor-modelo" onSubmit={enviar} onKeyDown={ignorarEnter} noValidate>
        <fieldset disabled={salvar.isPending} className="min-w-0">
          <h1 className="sr-only">{novo ? 'Novo modelo' : 'Editar modelo'}</h1>

          <div className="flex flex-col gap-4 pb-28 lg:pb-0">
            <p className="flex items-start gap-2 rounded-xl bg-primary-suave p-3 text-sm text-primary">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              Editar o modelo não altera auditorias já feitas com ele.
            </p>

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
                  <CampoTexto
                    id="modelo-nome"
                    rotulo="Nome do modelo"
                    autoComplete="off"
                    autoFocus={novo}
                    placeholder="Ex.: Inspeção de padarias"
                    erro={errors.nome?.message}
                    {...register('nome')}
                  />
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="modelo-descricao" className="text-sm">
                      Descrição (opcional)
                    </Label>
                    <Textarea
                      id="modelo-descricao"
                      rows={2}
                      aria-invalid={errors.descricao ? true : undefined}
                      aria-describedby={errors.descricao ? 'modelo-descricao-erro' : undefined}
                      {...register('descricao')}
                    />
                    {errors.descricao && (
                      <p id="modelo-descricao-erro" className="text-sm text-destructive">
                        {errors.descricao.message}
                      </p>
                    )}
                  </div>
                </div>

                {camposSecoes.map((secao, indice) => (
                  <SecaoEditor
                    key={secao.chave}
                    form={form}
                    indice={indice}
                    totalSecoes={camposSecoes.length}
                    aberta={!fechadas.has(secao.chave)}
                    onAlternar={() => alternarSecao(secao.chave)}
                    onMoverSecao={moverSecao}
                    onRemoverSecao={removerSecao}
                    onMoverPergunta={moverParaOutraSecao}
                  />
                ))}

                {erroListaSecoes && (
                  <p
                    data-erro-lista
                    tabIndex={-1}
                    className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive outline-none"
                  >
                    {erroListaSecoes}
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 border-dashed bg-transparent text-base"
                  onClick={() =>
                    adicionarSecao(novaSecao(), { focusName: `secoes.${camposSecoes.length}.titulo` })
                  }
                >
                  <Plus aria-hidden />
                  Adicionar seção
                </Button>
              </div>

              <PainelLateral
                control={control}
                salvando={salvar.isPending}
                novo={novo}
                erroGeral={erroGeral}
                temErros={temErros}
                onIrParaSecao={irParaSecao}
              />
            </div>
          </div>

          <RodapeSalvar
            control={control}
            salvando={salvar.isPending}
            novo={novo}
            erroGeral={erroGeral}
            temErros={temErros}
          />
        </fieldset>
      </form>

      <AlertDialog open={blocker.state === 'blocked'} onOpenChange={(aberto) => !aberto && blocker.reset?.()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações não vão para o modelo. Elas ficam guardadas como rascunho neste aparelho, e você poderá
              recuperá-las ao abrir o editor de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Continuar editando</AlertDialogCancel>
            <AlertDialogAction variant="destructive" className="h-11" onClick={() => blocker.proceed?.()}>
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProvedorArrasto>
  )
}
