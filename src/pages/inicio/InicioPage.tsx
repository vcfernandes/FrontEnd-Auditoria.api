import { Link } from 'react-router'
import { useLogin, useMe } from '@/api/auth'
import { ApiError } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** Página provisória: só prova que Tailwind, shadcn, Router, TanStack Query e o cliente HTTP estão ligados. */
export function InicioPage() {
  const me = useMe()
  const login = useLogin()
  const erroLogin = login.error instanceof ApiError ? login.error : null

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Auditorias</h1>

      <Card>
        <CardHeader>
          <CardTitle>Base do protótipo</CardTitle>
          <CardDescription>
            API: <code>{import.meta.env.VITE_API_URL}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span>GET /auth/me</span>
            {me.isPending && <Badge variant="secondary">Carregando…</Badge>}
            {me.isSuccess && <Badge>Logado como {me.data.nome}</Badge>}
            {me.isError && (
              <Badge variant="destructive">
                {me.error instanceof ApiError ? `${me.error.status} · ${me.error.message}` : me.error.message}
              </Badge>
            )}
          </div>
          <Button size="lg" variant="outline" className="h-12" onClick={() => me.refetch()}>
            Chamar /auth/me de novo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Erro de validação</CardTitle>
          <CardDescription>Envia um login vazio e mostra as mensagens por campo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <Button
            size="lg"
            className="h-12"
            disabled={login.isPending}
            onClick={() => login.mutate({ email: '', senha: '' })}
          >
            Testar POST /auth/login
          </Button>
          {erroLogin && (
            <div className="rounded-lg border p-3">
              <p className="font-medium">
                {erroLogin.status} · {erroLogin.message}
              </p>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {Object.entries(erroLogin.campos).map(([campo, mensagem]) => (
                  <li key={campo}>
                    <strong>{campo}</strong>: {mensagem}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Button asChild size="lg" variant="link" className="h-12">
        <Link to="/rota-que-nao-existe">Testar navegação (página inexistente)</Link>
      </Button>
    </main>
  )
}
