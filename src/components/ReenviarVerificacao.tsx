import { MailPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useReenviarVerificacao } from '@/api/auth'
import { ApiError } from '@/api/client'
import { CampoTexto } from '@/components/CampoTexto'
import { Button } from '@/components/ui/button'

/** A API aceita 1 reenvio por minuto por e-mail; o botão espera o mesmo tempo para não chegar ao 429. */
const ESPERA_SEGUNDOS = 60

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
}

function rotuloDoBotao(enviando: boolean, espera: number, pedirEmail: boolean) {
  if (enviando) return 'Enviando…'
  if (espera > 0) return `Reenviar de novo em ${espera} s`
  return pedirEmail ? 'Enviar novo link de confirmação' : 'Reenviar e-mail de confirmação'
}

/**
 * Reenvia o e-mail de confirmação. Com `email`, usa esse endereço; com `pedirEmail`, mostra o campo
 * (link inválido, quando não sabemos de quem é). A resposta da API é igual para qualquer e-mail.
 */
export function ReenviarVerificacao({ email, pedirEmail = false }: Readonly<{ email?: string; pedirEmail?: boolean }>) {
  const reenviar = useReenviarVerificacao()
  const [digitado, setDigitado] = useState(email ?? '')
  const [erroCampo, setErroCampo] = useState<string | null>(null)
  const [espera, setEspera] = useState(0)
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null)

  useEffect(() => {
    if (espera <= 0) return
    const id = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [espera])

  const alvo = (pedirEmail ? digitado : (email ?? '')).trim()

  const enviar = () => {
    if (!emailValido(alvo)) {
      setErroCampo('Informe um e-mail válido')
      return
    }
    setErroCampo(null)
    reenviar.mutate(alvo, {
      onSuccess: () => {
        setEnviadoPara(alvo)
        setEspera(ESPERA_SEGUNDOS)
      },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {pedirEmail && (
        <CampoTexto
          rotulo="Seu e-mail"
          name="reenviar-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={digitado}
          erro={erroCampo ?? undefined}
          onChange={(e) => setDigitado(e.target.value)}
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 text-base"
        disabled={reenviar.isPending || espera > 0}
        onClick={enviar}
      >
        <MailPlus aria-hidden />
        {rotuloDoBotao(reenviar.isPending, espera, pedirEmail)}
      </Button>
      {enviadoPara && !reenviar.isError && (
        <p role="status" className="rounded-lg bg-emerald-600/10 p-3 text-sm text-emerald-800">
          {pedirEmail
            ? 'Se houver uma conta aguardando confirmação com este e-mail, enviamos um novo link.'
            : `Enviamos um novo e-mail para ${enviadoPara}. Veja também a caixa de spam.`}
        </p>
      )}
      {reenviar.isError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {reenviar.error instanceof ApiError ? reenviar.error.message : 'Não foi possível reenviar o e-mail. Tente de novo.'}
        </p>
      )}
    </div>
  )
}
