export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, '')
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

/** Data de hoje no fuso do aparelho, como aaaa-mm-dd (formato do input date e da API). */
export function hojeIso() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

/** Converte aaaa-mm-dd em dd/mm/aaaa sem passar por Date (evita deslocar o dia por fuso). */
export function formatarData(iso?: string) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
