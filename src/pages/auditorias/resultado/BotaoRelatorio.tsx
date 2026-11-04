import { Download, ExternalLink, Loader2, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ROTULO_FORMATO, useRelatorioPdf, type FormatoRelatorio } from '@/api/auditorias'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { baixar, compartilhar, ehTelaDeToque, podeCompartilhar } from '@/lib/arquivo'

interface Pdf {
  arquivo: File
  url: string
}

/**
 * Computador: baixa direto com o nome do servidor.
 * Celular: abre a folha de compartilhar. Como alguns navegadores (Safari) só permitem compartilhar
 * logo após um toque, os botões Compartilhar/Abrir ficam disponíveis depois do download.
 */
export function BotaoRelatorio({ auditoriaId }: { auditoriaId: string }) {
  const relatorio = useRelatorioPdf(auditoriaId)
  const [pdf, setPdf] = useState<Pdf | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  const gerar = (formato: FormatoRelatorio) => {
    if (relatorio.isPending) return
    relatorio.mutate(formato, {
      onSuccess: ({ blob, nome }) => {
        const arquivo = new File([blob], nome ?? `relatorio-${auditoriaId}-${formato}.pdf`, { type: 'application/pdf' })
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        const url = URL.createObjectURL(arquivo)
        urlRef.current = url
        setPdf({ arquivo, url })

        if (!ehTelaDeToque()) baixar(url, arquivo.name)
        else if (podeCompartilhar(arquivo)) void compartilhar(arquivo)
      },
    })
  }

  const compartilhavel = pdf && podeCompartilhar(pdf.arquivo)

  return (
    <div className="flex flex-col gap-2">
      {(['resumido', 'completo'] as const).map((formato) => {
        const gerando = relatorio.isPending && relatorio.variables === formato
        return (
          <Button
            key={formato}
            variant={formato === 'resumido' ? 'default' : 'outline'}
            size="lg"
            className="h-12 text-base"
            disabled={relatorio.isPending}
            aria-busy={gerando}
            onClick={() => gerar(formato)}
          >
            {gerando ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            {gerando ? 'Gerando… pode levar alguns segundos' : ROTULO_FORMATO[formato]}
          </Button>
        )
      })}
      <p className="text-xs text-muted-foreground">
        O relatório para o cliente traz a nota, as não conformidades com fotos e as assinaturas. O completo traz isso e mais o checklist inteiro, para arquivo e fiscalização.
      </p>

      {relatorio.isError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {relatorio.error instanceof ApiError ? relatorio.error.message : 'Não foi possível gerar o PDF.'}
        </p>
      )}

      {pdf && (
        <div className="flex flex-col gap-2 rounded-xl border p-3">
          <p className="truncate text-sm text-muted-foreground" title={pdf.arquivo.name}>
            {pdf.arquivo.name}
          </p>
          <div className={compartilhavel ? 'grid grid-cols-2 gap-2' : 'grid gap-2'}>
            {compartilhavel && (
              <Button variant="outline" size="lg" className="h-12" onClick={() => void compartilhar(pdf.arquivo)}>
                <Share2 aria-hidden />
                Compartilhar
              </Button>
            )}
            <Button asChild variant="outline" size="lg" className="h-12">
              <a href={pdf.url} target="_blank" rel="noopener">
                <ExternalLink aria-hidden />
                Abrir PDF
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
