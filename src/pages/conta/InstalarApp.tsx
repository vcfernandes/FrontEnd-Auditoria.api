import { CheckCircle2, Download, Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useInstalacao } from '@/pwa/instalacao'

export function InstalarApp() {
  const { estado, instalar } = useInstalacao()

  return (
    <section aria-labelledby="instalar-titulo" className="flex flex-col gap-3">
      <h2 id="instalar-titulo" className="text-lg font-semibold">
        Instalar no celular
      </h2>
      <Card>
        <CardContent className="flex flex-col gap-4 text-sm">
          {estado === 'instalado' && (
            <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />O app já está instalado neste aparelho.
            </p>
          )}

          {estado === 'instalavel' && (
            <>
              <p className="text-muted-foreground">
                Instale para abrir direto da tela inicial, em tela cheia, como um aplicativo.
              </p>
              <Button size="lg" className="h-12 text-base" onClick={() => void instalar()}>
                <Download aria-hidden />
                Instalar app
              </Button>
            </>
          )}

          {estado === 'ios' && (
            <>
              <p className="text-muted-foreground">
                No iPhone, a instalação é feita pelo Safari, em três passos:
              </p>
              <ol className="flex flex-col gap-3">
                <li className="flex items-start gap-3">
                  <Share className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <span>
                    Toque em <strong>Compartilhar</strong> (o quadrado com uma seta para cima) na barra do Safari.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <SquarePlus className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <span>
                    Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <span>
                    Toque em <strong>Adicionar</strong>. O ícone “Auditorias” aparece na tela inicial.
                  </span>
                </li>
              </ol>
            </>
          )}

          {estado === 'indisponivel' && (
            <p className="text-muted-foreground">
              No Android, abra este endereço no <strong>Chrome</strong> e use o menu <strong>⋮</strong> →{' '}
              <strong>Instalar app</strong> (ou <strong>Adicionar à tela inicial</strong>). No iPhone, use o{' '}
              <strong>Safari</strong>: Compartilhar → <strong>Adicionar à Tela de Início</strong>. A instalação só
              é oferecida em conexão segura (https).
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
