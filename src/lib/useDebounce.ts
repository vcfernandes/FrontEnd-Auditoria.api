import { useEffect, useState } from 'react'

/** Devolve `valor` só depois de `atrasoMs` sem mudanças. */
export function useDebounce<T>(valor: T, atrasoMs = 400) {
  const [atrasado, setAtrasado] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), atrasoMs)
    return () => clearTimeout(id)
  }, [valor, atrasoMs])

  return atrasado
}
