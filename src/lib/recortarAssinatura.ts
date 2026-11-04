/** Tamanho máximo do PNG enviado (a API aceita até 2000 px e 500 KB; 600 x 200 sobra para o PDF). */
const LARGURA_MAXIMA = 600
const ALTURA_MAXIMA = 200
const MARGEM = 6

/**
 * Recorta o espaço vazio em volta do traço (fundo transparente) e reduz se passar de 600 x 200 px.
 * Devolve `null` se não há traço.
 */
export function recortarAssinatura(origem: HTMLCanvasElement): Promise<Blob | null> {
  const contexto = origem.getContext('2d', { willReadFrequently: true })
  if (!contexto || origem.width === 0 || origem.height === 0) return Promise.resolve(null)

  const { data, width, height } = contexto.getImageData(0, 0, origem.width, origem.height)
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return Promise.resolve(null)

  // O canvas é desenhado em escala do aparelho (devicePixelRatio): a margem acompanha.
  const margem = Math.round(MARGEM * (origem.width / (origem.clientWidth || origem.width)))
  const x0 = Math.max(0, minX - margem)
  const y0 = Math.max(0, minY - margem)
  const larguraCorte = Math.min(width, maxX + margem + 1) - x0
  const alturaCorte = Math.min(height, maxY + margem + 1) - y0

  const escala = Math.min(1, LARGURA_MAXIMA / larguraCorte, ALTURA_MAXIMA / alturaCorte)
  const destino = document.createElement('canvas')
  destino.width = Math.max(1, Math.round(larguraCorte * escala))
  destino.height = Math.max(1, Math.round(alturaCorte * escala))
  const saida = destino.getContext('2d')
  if (!saida) return Promise.resolve(null)
  saida.imageSmoothingQuality = 'high'
  saida.drawImage(origem, x0, y0, larguraCorte, alturaCorte, 0, 0, destino.width, destino.height)

  return new Promise((resolver) => destino.toBlob(resolver, 'image/png'))
}
