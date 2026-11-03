import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/api/client'

/** Campo de lista da API para o caminho do formulário: `secoes[0].perguntas[2].peso` → `secoes.0.perguntas.2.peso`. */
export function caminhoDoCampoApi(campo: string) {
  return campo.replace(/\[(\d+)\]/g, '.$1')
}

/**
 * Coloca os erros de validação (400) nos campos do formulário.
 * Devolve a mensagem geral a mostrar quando o erro não pertence a um campo.
 */
export function aplicarErroApi<T extends FieldValues>(
  erro: unknown,
  setError: UseFormSetError<T>,
  campos: readonly Path<T>[],
): string | null {
  if (!(erro instanceof ApiError)) return 'Algo deu errado. Tente novamente.'

  let algumCampo = false
  for (const [campo, mensagem] of Object.entries(erro.campos)) {
    if ((campos as readonly string[]).includes(campo)) {
      setError(campo as Path<T>, { type: 'server', message: mensagem })
      algumCampo = true
    }
  }
  return algumCampo ? null : erro.message
}
