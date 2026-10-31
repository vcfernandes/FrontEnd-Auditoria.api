import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NaoEncontradaPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe.</p>
      <Button asChild size="lg" className="h-12 w-full">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </main>
  )
}
