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
