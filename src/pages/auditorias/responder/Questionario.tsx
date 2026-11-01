import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useBlocker, useNavigate } from 'react-router'
import {
  useFinalizarAuditoria,
  useSalvamentoRespostas,
  type Auditoria,
  type ItemAuditoria,
} from '@/api/auditorias'
import { ApiError } from '@/api/client'
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
import type { RespostaLocal, ValorResposta } from '@/lib/filaRespostas'
import { BarraProgresso } from './BarraProgresso'
import { SecaoBloco } from './SecaoBloco'

interface Secao {
  titulo: string
  itens: ItemAuditoria[]
}

const porOrdem = (a: { ordem?: number }, b: { ordem?: number }) => (a.ordem ?? 0) - (b.ordem ?? 0)

function montarSecoes(auditoria: Auditoria): Secao[] {
  return [...(auditoria.secoes ?? [])].sort(porOrdem).map((s) => ({
    titulo: s.titulo ?? '',
    itens: [...(s.itens ?? [])].sort(porOrdem),
  }))
}

export function Questionario({ auditoria }: { auditoria: Auditoria }) {
  const id = auditoria.id!
  const navigate = useNavigate()
  const { fila, estado } = useSalvamentoRespostas(id)
  const finalizar = useFinalizarAuditoria(id)

  // A estrutura não muda durante a tela: guardada uma vez para não recriar as perguntas a cada salvamento.
  const [secoes] = useState(() => montarSecoes(auditoria))
  const todosItens = useMemo(() => secoes.flatMap((s) => s.itens), [secoes])

  const [respostas, setRespostas] = useState<Record<string, RespostaLocal>>(() =>
    Object.fromEntries(
      todosItens.map((i) => [i.id!, { resposta: i.resposta ?? null, observacao: i.observacao ?? '' }]),
    ),
  )
  const respostasRef = useRef(respostas)

  const [abertas, setAbertas] = useState<Set<number>>(() => {
    const primeiraIncompleta = secoes.findIndex((s) => s.itens.some((i) => !i.resposta))
    return new Set([Math.max(primeiraIncompleta, 0)])
  })
  const [visiveis, setVisiveis] = useState<Set<string> | null>(null)
  const [destacar, setDestacar] = useState(false)
  const [erroFinalizar, setErroFinalizar] = useState<string | null>(null)
  const [preparando, setPreparando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const atualizar = useCallback(
    (itemId: string, parcial: Partial<RespostaLocal>) => {
      const novo = { ...respostasRef.current[itemId], ...parcial }
      respostasRef.current = { ...respostasRef.current, [itemId]: novo }
      setRespostas(respostasRef.current)
      fila.alterar(itemId, novo)
    },
    [fila],
  )
  const onResposta = useCallback(
    (itemId: string, resposta: ValorResposta | null) => atualizar(itemId, { resposta }),
    [atualizar],
  )
  const onObservacao = useCallback(
    (itemId: string, observacao: string) => atualizar(itemId, { observacao }),
    [atualizar],
  )
  const onAlternar = useCallback((indice: number) => {
    setAbertas((atual) => {
      const nova = new Set(atual)
      if (nova.has(indice)) nova.delete(indice)
      else nova.add(indice)
      return nova
    })
  }, [])

  const respondidas = todosItens.filter((i) => respostas[i.id!].resposta).length
  const obrigatoriasPendentes = todosItens.filter((i) => i.obrigatoria && !respostas[i.id!].resposta).length
  const semResposta = todosItens.length - respondidas

  /** Liga/desliga "só pendentes". A lista é fotografada ao ligar, para a pergunta não sumir ao ser respondida. */
  const alternarFiltro = () => {
    if (visiveis) {
      setVisiveis(null)
      return
    }
    const pendentes = new Set(todosItens.filter((i) => !respostasRef.current[i.id!].resposta).map((i) => i.id!))
    setVisiveis(pendentes)
    setAbertas(new Set(secoes.flatMap((s, indice) => (s.itens.some((i) => pendentes.has(i.id!)) ? [indice] : []))))
  }

  const irParaPrimeiraPendente = () => {
    const atuais = respostasRef.current
    const alvo =
      todosItens.find((i) => i.obrigatoria && !atuais[i.id!].resposta) ?? todosItens.find((i) => !atuais[i.id!].resposta)
    if (!alvo) return
    const indice = secoes.findIndex((s) => s.itens.includes(alvo))
    flushSync(() => {
      setVisiveis(null)
      setDestacar(true)
      setAbertas((atual) => new Set(atual).add(indice))
    })
    document.getElementById(`pergunta-${alvo.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // 1º salva o que falta; só então pede confirmação.
  const pedirFinalizacao = async () => {
    setErroFinalizar(null)
    setPreparando(true)
    const salvou = await fila.salvarAgora()
    setPreparando(false)
    if (!salvou) {
      setErroFinalizar('Não foi possível salvar as últimas respostas. Verifique a conexão e tente de novo.')
      return
    }
    setConfirmando(true)
  }

  const confirmarFinalizacao = () => {
    finalizar.mutate(undefined, {
      onSuccess: () => navigate(`/auditorias/${id}/resultado`, { replace: true }),
      onError: (erro) => {
        setErroFinalizar(erro instanceof ApiError ? erro.message : 'Não foi possível finalizar a auditoria.')
        if (erro instanceof ApiError && erro.status === 422) irParaPrimeiraPendente()
      },
    })
  }

  // Sair da tela com algo não salvo: tenta salvar e só sai se conseguir (ou se o usuário insistir).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      fila.temAlteracoes() && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    let ativo = true
    void fila.salvarAgora().then((ok) => {
      if (ok && ativo) blocker.proceed()
    })
    return () => {
      ativo = false
    }
  }, [blocker, fila])

  // Fechar/recarregar a aba com algo não salvo: aviso do navegador.
  useEffect(() => {
    const avisar = (e: BeforeUnloadEvent) => {
      if (fila.temAlteracoes()) e.preventDefault()
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [fila])

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h1 className="sr-only">Responder auditoria</h1>
      <BarraProgresso
        cliente={auditoria.clienteNome}
        modelo={auditoria.modeloNome}
        respondidas={respondidas}
        total={todosItens.length}
        obrigatoriasPendentes={obrigatoriasPendentes}
        estado={estado}
        soPendentes={visiveis !== null}
        onTentarDeNovo={() => fila.tentarDeNovo()}
        onAlternarFiltro={alternarFiltro}
      />

      {secoes.map((secao, indice) => {
        if (visiveis && !secao.itens.some((i) => visiveis.has(i.id!))) return null
        return (
          <SecaoBloco
            key={indice}
            indice={indice}
            titulo={secao.titulo}
            itens={secao.itens}
            respostas={respostas}
            aberta={abertas.has(indice)}
            visiveis={visiveis}
            destacar={destacar}
            onAlternar={onAlternar}
            onResposta={onResposta}
            onObservacao={onObservacao}
          />
        )
      })}
      {visiveis && visiveis.size === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          Nenhuma pergunta pendente. 🎉
        </p>
      )}

      {/* Rodapé fixo: acima da barra de navegação no celular */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-60 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {erroFinalizar && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erroFinalizar}
            </p>
          )}
          <Button
            size="lg"
            className="h-12 w-full text-base"
            disabled={preparando || finalizar.isPending}
            onClick={() => void pedirFinalizacao()}
          >
            {(preparando || finalizar.isPending) && <Loader2 className="animate-spin" aria-hidden />}
            {preparando ? 'Salvando respostas…' : finalizar.isPending ? 'Finalizando…' : 'Finalizar auditoria'}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar auditoria?</AlertDialogTitle>
            <AlertDialogDescription>
              {semResposta > 0
                ? `Ainda há ${semResposta} ${semResposta === 1 ? 'pergunta' : 'perguntas'} sem resposta. `
                : 'Todas as perguntas foram respondidas. '}
              Depois de finalizada, a auditoria só pode ser alterada se for reaberta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Continuar respondendo</AlertDialogCancel>
            <AlertDialogAction className="h-11" onClick={confirmarFinalizacao}>
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blocker.state === 'blocked'} onOpenChange={(aberto) => !aberto && blocker.reset?.()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {estado.status === 'erro' ? 'Respostas não salvas' : 'Salvando respostas…'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {estado.status === 'erro'
                ? `${estado.mensagem ?? ''} Se sair agora, as últimas respostas serão perdidas.`
                : 'Aguarde um instante: a tela fecha assim que tudo estiver salvo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11" onClick={() => blocker.reset?.()}>
              Ficar na auditoria
            </AlertDialogCancel>
            {estado.status === 'erro' && (
              <AlertDialogAction variant="destructive" className="h-11" onClick={() => blocker.proceed?.()}>
                Sair sem salvar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
