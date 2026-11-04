export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, '')
}

/** "Vinicius Fernandes" → "VF"; um nome só → as duas primeiras letras. */
export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

/** Aplica a máscara 00.000.000/0000-00 enquanto digita (aceita valor com ou sem máscara). */
export function mascararCnpj(valor: string) {
  const d = somenteDigitos(valor).slice(0, 14)
  let r = d.slice(0, 2)
  if (d.length > 2) r += `.${d.slice(2, 5)}`
  if (d.length > 5) r += `.${d.slice(5, 8)}`
  if (d.length > 8) r += `/${d.slice(8, 12)}`
  if (d.length > 12) r += `-${d.slice(12, 14)}`
  return r
}

/** Data no fuso do aparelho como aaaa-mm-dd (formato do input date e da API). */
function isoLocal(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export function hojeIso() {
  return isoLocal(new Date())
}

/** Primeiro dia do mês atual (aaaa-mm-dd). */
export function inicioDoMesIso() {
  const hoje = new Date()
  return isoLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
}

/** Início de um período de `dias` que termina hoje (90 → hoje e os 89 dias anteriores, como no painel da API). */
export function inicioDoPeriodoIso(dias: number) {
  const hoje = new Date()
  return isoLocal(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (dias - 1)))
}

/** "Domingo, 1 de novembro de 2026". */
export function dataPorExtenso(data = new Date()) {
  const texto = data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Nota com vírgula e duas casas: 69,23. */
export function formatarNota(nota?: number) {
  if (nota === undefined || nota === null) return '—'
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Converte aaaa-mm-dd em dd/mm/aaaa sem passar por Date (evita deslocar o dia por fuso). */
export function formatarData(iso?: string) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/** Instante ISO (com fuso) no horário do aparelho: "04/11/2026 às 14:30". */
export function formatarDataHora(iso?: string) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'
  const dia = data.toLocaleDateString('pt-BR')
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dia} às ${hora}`
}
