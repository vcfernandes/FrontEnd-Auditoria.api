import { useEffect, useState } from 'react'

/**
 * Lê o `token` da URL (links dos e-mails) uma única vez e o tira da barra de endereço, para não ficar no
 * histórico, em capturas de tela nem no cabeçalho `Referer`. O valor fica guardado na tela enquanto ela existe.
 * Devolve `null` se não havia token (por exemplo, depois de recarregar a página).
 */
export function useTokenDaUrl() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token')?.trim() || null)

  useEffect(() => {
    if (window.location.search) {
      // Mantém o `state` do histórico: o React Router guarda nele a posição da navegação.
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash)
    }
  }, [])

  return token
}
