import { BotaoNovo } from '@/components/BotaoNovo'

export function AuditoriasPage() {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h1 className="sr-only text-2xl font-semibold md:not-sr-only">Auditorias</h1>
        <BotaoNovo para="/auditorias/nova" rotulo="Nova auditoria" />
      </div>
      <p className="text-muted-foreground">
        Toque em “Nova auditoria” para começar. O histórico das auditorias aparecerá aqui em breve.
      </p>
    </section>
  )
}
