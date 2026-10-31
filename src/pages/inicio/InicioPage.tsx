import { useMe } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'

/** Página provisória até o layout com navegação e a lista de auditorias. */
export function InicioPage() {
  const { sair } = useAuth()
  const me = useMe()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div>
        {me.isPending && <p className="text-muted-foreground">Carregando…</p>}
        {me.isSuccess && (
          <>
            <h1 className="text-2xl font-semibold">Olá, {me.data.nome}</h1>
            <p className="text-sm text-muted-foreground">{me.data.email}</p>
          </>
        )}
        {me.isError && (
          <p role="alert" className="text-destructive">
            {me.error instanceof ApiError ? me.error.message : 'Não foi possível carregar seus dados.'}
          </p>
        )}
      </div>
      <Button variant="outline" size="lg" className="h-12 text-base" onClick={sair}>
        Sair
      </Button>
    </main>
  )
}
