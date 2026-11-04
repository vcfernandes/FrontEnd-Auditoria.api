const LADO_MAXIMO = 1600
/** Limite do backend. Com 1600 px quase nunca chega perto; as qualidades menores são só para a foto muito detalhada. */
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024
const QUALIDADES = [0.75, 0.6, 0.45]

function carregarImagem(url: string) {
  return new Promise<HTMLImageElement>((resolver, rejeitar) => {
    const imagem = new Image()
    imagem.onload = () => resolver(imagem)
    imagem.onerror = () => rejeitar(new Error('Imagem ilegível'))
    imagem.src = url
  })
}

function paraJpeg(canvas: HTMLCanvasElement, qualidade: number) {
  return new Promise<Blob>((resolver, rejeitar) => {
    canvas.toBlob(
      (blob) => (blob ? resolver(blob) : rejeitar(new Error('Falha ao gerar o JPEG'))),
      'image/jpeg',
      qualidade,
    )
  })
}

/**
 * Reduz para no máximo 1600 px no lado maior e converte para JPEG.
 * Desenhar a partir de um <img> já aplica a orientação gravada na foto (EXIF), e o JPEG gerado sai sem EXIF
 * (inclusive sem a localização). Rejeita se o navegador não souber ler o arquivo (ex.: HEIC fora do Safari).
 */
export async function comprimirFoto(arquivo: Blob): Promise<Blob> {
  const url = URL.createObjectURL(arquivo)
  const canvas = document.createElement('canvas')
  try {
    const imagem = await carregarImagem(url)
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.naturalWidth, imagem.naturalHeight))
    canvas.width = Math.round(imagem.naturalWidth * escala)
    canvas.height = Math.round(imagem.naturalHeight * escala)

    const contexto = canvas.getContext('2d')
    if (!contexto) throw new Error('Canvas indisponível')
    // JPEG não tem transparência: sem o fundo branco, um PNG transparente ficaria com fundo preto.
    contexto.fillStyle = '#ffffff'
    contexto.fillRect(0, 0, canvas.width, canvas.height)
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height)

    for (const qualidade of QUALIDADES) {
      const jpeg = await paraJpeg(canvas, qualidade)
      if (jpeg.size <= TAMANHO_MAXIMO_BYTES) return jpeg
    }
    throw new Error('Foto grande demais')
  } finally {
    URL.revokeObjectURL(url)
    // Libera logo a memória do canvas (importante no iPhone).
    canvas.width = 0
    canvas.height = 0
  }
}
