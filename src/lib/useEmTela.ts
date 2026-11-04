import { useEffect, useRef, useState } from 'react'

/** Fica `true` (e não volta) quando o elemento chega perto da área visível: serve para só baixar o que será visto. */
export function useEmTela<T extends Element>() {
  const elemento = useRef<T>(null)
  const [emTela, setEmTela] = useState(false)

  useEffect(() => {
    if (emTela || !elemento.current) return
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) setEmTela(true)
      },
      { rootMargin: '200px' },
    )
    observador.observe(elemento.current)
    return () => observador.disconnect()
  }, [emTela])

  return { elemento, emTela }
}
