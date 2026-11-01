// Último endereço (com filtros) de cada lista, para a seta "voltar" e os links "Voltar" restaurarem a lista como estava.
// Só em memória: recarregar a página volta para a lista sem filtros.
const buscas = new Map<string, string>()

export function lembrarBusca(caminho: string, search: string) {
  buscas.set(caminho, search)
}

export function comBuscaLembrada(caminho: string) {
  return caminho + (buscas.get(caminho) ?? '')
}
