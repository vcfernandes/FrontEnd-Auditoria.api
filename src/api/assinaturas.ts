import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { chaveDetalhe, type Auditoria } from './auditorias'
import { api, type Schemas } from './client'

export type Assinatura = Schemas['AssinaturaResponse']
export type PapelAssinatura = NonNullable<Assinatura['papel']>

export const ROTULO_PAPEL: Record<PapelAssinatura, string> = {
  AUDITOR: 'Auditor',
  RESPONSAVEL: 'Responsável pelo estabelecimento',
}

const chaveImagem = (auditoriaId: string, assinatura: Assinatura | undefined) => [
  'assinaturas',
  auditoriaId,
  assinatura?.papel,
  // A data entra na chave: assinar de novo troca a imagem sem esperar o cache vencer.
  assinatura?.assinadoEm,
]

/** Troca (ou tira, com `nova` indefinida) a assinatura do papel na cópia do detalhe da auditoria. */
function comAssinatura(auditoria: Auditoria, papel: PapelAssinatura, nova?: Assinatura): Auditoria {
  const outras = (auditoria.assinaturas ?? []).filter((a) => a.papel !== papel)
  const lista = nova ? [...outras, nova] : outras
  // O auditor vem antes do responsável, como na API.
  const ordem = (a: Assinatura) => (a.papel === 'AUDITOR' ? 0 : 1)
  return { ...auditoria, assinaturas: lista.sort((a, b) => ordem(a) - ordem(b)) }
}

/** Envia a assinatura (PNG) de um papel; substitui a anterior. Só com a auditoria finalizada. */
export function useAssinar(auditoriaId: string, papel: PapelAssinatura) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ imagem, nome, cargo }: { imagem: Blob; nome: string; cargo: string }) => {
      const corpo = new FormData()
      corpo.append('imagem', imagem, 'assinatura.png')
      corpo.append('nome', nome)
      if (cargo) corpo.append('cargo', cargo)
      return api.put<Assinatura>(`/auditorias/${auditoriaId}/assinaturas/${papel}`, corpo)
    },
    onSuccess: (assinatura) => {
      toast.success('Assinatura salva.')
      cliente.setQueryData<Auditoria>(chaveDetalhe(auditoriaId), (atual) =>
        atual ? comAssinatura(atual, papel, assinatura) : atual,
      )
      cliente.removeQueries({ queryKey: ['assinaturas', auditoriaId, papel] })
    },
  })
}

export function useRemoverAssinatura(auditoriaId: string, papel: PapelAssinatura) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/auditorias/${auditoriaId}/assinaturas/${papel}`),
    onSuccess: () => {
      toast.success('Assinatura removida.')
      cliente.setQueryData<Auditoria>(chaveDetalhe(auditoriaId), (atual) =>
        atual ? comAssinatura(atual, papel) : atual,
      )
      cliente.removeQueries({ queryKey: ['assinaturas', auditoriaId, papel] })
    },
  })
}

/** Imagem da assinatura, com o token (um `<img src>` direto não leva o header). */
export function useImagemAssinatura(auditoriaId: string, assinatura: Assinatura | undefined) {
  return useQuery({
    queryKey: chaveImagem(auditoriaId, assinatura),
    queryFn: async ({ signal }) => (await api.arquivo(assinatura!.caminho!, { signal, semAviso: true })).blob,
    enabled: !!assinatura?.caminho,
    staleTime: Infinity,
  })
}
