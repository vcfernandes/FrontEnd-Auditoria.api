import { useEffect, useRef, type ComponentProps } from 'react'

/** `<img>` de um blob: cria a URL temporária e a libera ao trocar de blob ou sair da tela. */
export function ImagemDeBlob({ blob, ...props }: { blob: Blob } & Omit<ComponentProps<'img'>, 'src'>) {
  const imagem = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(blob)
    if (imagem.current) imagem.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [blob])

  return <img ref={imagem} {...props} />
}
