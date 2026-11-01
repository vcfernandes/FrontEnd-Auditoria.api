/** Tela de toque (celular/tablet): ali o PDF vai para a folha de compartilhar em vez de baixar. */
export function ehTelaDeToque() {
  return window.matchMedia('(pointer: coarse)').matches
}

export function podeCompartilhar(arquivo: File) {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files: [arquivo] })
}

/** Abre a folha de compartilhar do sistema (WhatsApp, e-mail…). Devolve `false` se o navegador recusar. */
export async function compartilhar(arquivo: File) {
  try {
    await navigator.share({ files: [arquivo], title: arquivo.name })
    return true
  } catch (erro) {
    // AbortError = o usuário fechou a folha; não é falha.
    return erro instanceof DOMException && erro.name === 'AbortError'
  }
}

/** Baixa um arquivo já em memória com o nome indicado. */
export function baixar(url: string, nome: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.append(link)
  link.click()
  link.remove()
}
