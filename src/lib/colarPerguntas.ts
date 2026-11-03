/**
 * Numeração ou marcador no começo da linha: "1.", "1)", "1.1", "1.1.", "1 -", "a)", "a." e "•".
 * "a." só com espaço depois, para não cortar siglas ("E.P.I. em uso?"); "1." não pode vir antes de outro dígito.
 * "1.1" sem pontuação final conta como numeração: em português o decimal usa vírgula.
 */
const NUMERACAO = /^(?:\d+(?:\.\d+)*[.)](?!\d)|\d+(?:\.\d+)+(?=\s)|\d+\s*[-–—](?=\s)|[a-z]\)|[a-z]\.(?=\s)|[-–—•*·](?=\s))\s*/i

/** Uma pergunta por linha: ignora linhas vazias e tira a numeração do começo. */
export function lerPerguntasColadas(texto: string): string[] {
  return texto
    .split(/\r\n|\r|\n/)
    .map((linha) => linha.trim().replace(NUMERACAO, '').trim())
    .filter((linha) => linha !== '')
}
