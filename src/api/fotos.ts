import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { aoMudarSessao, lerSessao } from '@/auth/session'
import { comprimirFoto } from '@/lib/comprimirFoto'
import { FilaFotos, type FotoLocal } from '@/lib/filaFotos'
import { chaveDetalhe, type Auditoria } from './auditorias'
import { ApiError, api, type Schemas } from './client'
import { queryClient } from './query-client'

export type Foto = Schemas['FotoResponse']

export const MAXIMO_FOTOS_POR_PERGUNTA = 5

const chaveImagem = (auditoriaId: string, fotoId: string | undefined) => ['fotos', auditoriaId, fotoId]

function alterarFotosDoItem(auditoriaId: string, itemId: string, alterar: (fotos: Foto[]) => Foto[]) {
  queryClient.setQueryData<Auditoria>(chaveDetalhe(auditoriaId), (atual) =>
    atual && {
      ...atual,
      secoes: atual.secoes?.map((secao) => ({
        ...secao,
        itens: secao.itens?.map((item) => (item.id === itemId ? { ...item, fotos: alterar(item.fotos ?? []) } : item)),
      })),
    },
  )
}

/** Exclui no servidor; `404` conta como excluída (a foto nunca chegou ou já foi apagada). */
async function excluirNoServidor(auditoriaId: string, fotoId: string) {
  try {
    await api.delete(`/auditorias/${auditoriaId}/fotos/${fotoId}`)
  } catch (erro) {
    if (!(erro instanceof ApiError && erro.status === 404)) throw erro
  }
}

/** Única no app: continua enviando se o usuário sair da tela da auditoria. */
export const filaFotos = new FilaFotos<Foto>({
  comprimir: comprimirFoto,
  enviar: (foto, signal) => {
    const corpo = new FormData()
    corpo.append('arquivo', foto.imagem, 'foto.jpg')
    return api.post<Foto>(`/auditorias/${foto.auditoriaId}/itens/${foto.itemId}/fotos`, corpo, {
      params: { id: foto.id },
      signal,
      semAviso: true, // a miniatura já mostra a falha; o aviso a cada nova tentativa só atrapalharia
    })
  },
  excluirNoServidor: (foto) => excluirNoServidor(foto.auditoriaId, foto.id),
  aoEnviar: (foto, enviada) => {
    // A imagem já está no aparelho: a miniatura não precisa baixar de novo.
    queryClient.setQueryData(chaveImagem(foto.auditoriaId, foto.id), foto.imagem)
    alterarFotosDoItem(foto.auditoriaId, foto.itemId, (fotos) =>
      fotos.some((f) => f.id === enviada.id) ? fotos : [...fotos, enviada],
    )
  },
  aoRecusar: (mensagem) => toast.error(`Foto não enviada. ${mensagem}`),
  aoVencerSessao: () =>
    toast.error('Sua sessão venceu. Entre de novo, sem fechar o app, para terminar de enviar as fotos.', {
      duration: 15_000,
    }),
})

// A fila vive fora das telas, então também cuida sozinha da rede, da sessão e de fechar o app.
window.addEventListener('online', () => filaFotos.tentarDeNovo())
window.addEventListener('beforeunload', (e) => {
  if (filaFotos.temPendentes()) e.preventDefault()
})
let usuarioDaFila = lerSessao()?.usuario.id
aoMudarSessao(() => {
  const usuario = lerSessao()?.usuario.id
  if (!usuario) {
    filaFotos.pausar()
    return
  }
  if (usuario !== usuarioDaFila) {
    filaFotos.esvaziar()
    usuarioDaFila = usuario
  }
  filaFotos.retomar()
})

/** Fotos da pergunta que ainda não subiram. */
export function useFotosLocais(itemId: string): FotoLocal[] {
  return useSyncExternalStore(filaFotos.assinar, () => filaFotos.doItem(itemId))
}

/** Quantas fotos da auditoria ainda não subiram. */
export function useFotosPendentes(auditoriaId: string) {
  return useSyncExternalStore(filaFotos.assinar, () => filaFotos.pendentes(auditoriaId))
}

/**
 * Fotos já salvas da pergunta. Lê o detalhe da auditoria sem buscar de novo; o `select` faz a pergunta
 * só redesenhar quando as fotos dela mudam, e não a cada resposta salva na auditoria.
 */
export function useFotosDoItem(auditoriaId: string, itemId: string) {
  const selecionar = useCallback(
    (auditoria: Auditoria) =>
      auditoria.secoes?.flatMap((s) => s.itens ?? []).find((i) => i.id === itemId)?.fotos ?? [],
    [itemId],
  )
  const { data } = useQuery({
    queryKey: chaveDetalhe(auditoriaId),
    queryFn: ({ signal }) => api.get<Auditoria>(`/auditorias/${auditoriaId}`, { signal }),
    select: selecionar,
    staleTime: Infinity,
  })
  return data ?? []
}

/** Imagem da foto, com o token (um `<img src>` direto não leva o header). O conteúdo de uma foto nunca muda. */
export function useImagemFoto(auditoriaId: string, foto: Foto | undefined, ativo: boolean) {
  return useQuery({
    queryKey: chaveImagem(auditoriaId, foto?.id),
    queryFn: async ({ signal }) => (await api.arquivo(foto!.caminho!, { signal, semAviso: true })).blob,
    enabled: ativo && !!foto?.caminho,
    staleTime: Infinity,
  })
}

/** Tira as imagens baixadas da memória ao sair da tela (as URLs temporárias, cada miniatura já libera). */
export function useLiberarFotosAoSair(auditoriaId: string) {
  const cliente = useQueryClient()
  useEffect(() => () => cliente.removeQueries({ queryKey: ['fotos', auditoriaId] }), [auditoriaId, cliente])
}

/** Exclui uma foto salva ou tira uma da fila; se ela já tentou subir, pode estar no servidor mesmo sem resposta. */
export function useExcluirFoto(auditoriaId: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (dados: { fotoId: string; itemId: string; local?: FotoLocal }) => {
      if (!dados.local || dados.local.jaTentou) await excluirNoServidor(auditoriaId, dados.fotoId)
    },
    onSuccess: (_, { fotoId, itemId }) => {
      toast.success('Foto excluída.')
      filaFotos.remover(fotoId)
      alterarFotosDoItem(auditoriaId, itemId, (fotos) => fotos.filter((f) => f.id !== fotoId))
      cliente.removeQueries({ queryKey: chaveImagem(auditoriaId, fotoId) })
    },
    onError: (erro) => {
      if (!(erro instanceof ApiError && erro.status === 0)) {
        toast.error(erro instanceof ApiError ? erro.message : 'Não foi possível excluir a foto.')
      }
    },
  })
}
