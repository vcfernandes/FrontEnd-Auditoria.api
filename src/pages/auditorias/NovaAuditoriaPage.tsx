import { ListChecks } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { useCriarAuditoria } from '@/api/auditorias'
import { useChecklists } from '@/api/checklists'
import { useCliente, type Cliente } from '@/api/clientes'
import { CampoTexto } from '@/components/CampoTexto'
import { EstadoVazio } from '@/components/EstadoVazio'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { aplicarErroApi } from '@/lib/erros'
import { formatarData, hojeIso } from '@/lib/formatadores'
import { EstadoModelos, ListaModelos } from './SeletorModelo'
import { SeletorCliente } from './SeletorCliente'

const esquema = z.object({
  clienteId: z.string().min(1, 'Escolha o cliente'),
  modeloId: z.string().min(1, 'Escolha o modelo de checklist'),
  data: z.string(),
  observacoes: z.string().max(2000, 'Máximo de 2000 caracteres'),
})
type Dados = z.infer<typeof esquema>

function Secao({ titulo, erro, children }: { titulo: string; erro?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {children}
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </section>
  )
}

export function NovaAuditoriaPage() {
  const navigate = useNavigate()
  const criar = useCriarAuditoria()
  const modelos = useChecklists()
  // Vem do menu "⋯" de um cliente na lista (Nova auditoria para este cliente).
  const [params] = useSearchParams()
  const clientePreSelecionado = useCliente(params.get('clienteId') ?? undefined)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<Dados>({
    resolver: zodResolver(esquema),
    defaultValues: { clienteId: '', modeloId: '', data: hojeIso(), observacoes: '' },
  })
  const [clienteId, modeloId, data] = useWatch({ control, name: ['clienteId', 'modeloId', 'data'] })
  const hoje = hojeIso()

  // Modelos inativos não podem ser usados (a API recusaria com 422).
  const lista = (modelos.data ?? []).filter((m) => m.ativo !== false)
  const unico = lista.length === 1 ? lista[0] : undefined

  // Se só existe um modelo (normalmente a RDC 216 da biblioteca), já vem marcado.
  useEffect(() => {
    if (unico?.id) setValue('modeloId', unico.id)
  }, [unico?.id, setValue])

  const escolherCliente = (novo: Cliente | null) => {
    setCliente(novo)
    setValue('clienteId', novo?.id ?? '', { shouldValidate: !!novo })
  }

  useEffect(() => {
    if (clientePreSelecionado.data) escolherCliente(clientePreSelecionado.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientePreSelecionado.data])

  const enviar = handleSubmit((dados) => {
    setErroGeral(null)
    criar.mutate(
      {
        clienteId: dados.clienteId,
        modeloId: dados.modeloId,
        data: dados.data || undefined,
        observacoes: dados.observacoes.trim() || undefined,
      },
      {
        onSuccess: (auditoria) => navigate(`/auditorias/${auditoria.id}/responder`, { replace: true }),
        onError: (erro) =>
          setErroGeral(aplicarErroApi(erro, setError, ['clienteId', 'modeloId', 'data', 'observacoes'])),
      },
    )
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Nova auditoria</h1>

      <form onSubmit={enviar} noValidate autoComplete="off" className="flex flex-col gap-8">
        <Secao titulo="Cliente" erro={errors.clienteId?.message}>
          <SeletorCliente valor={cliente} onChange={escolherCliente} />
        </Secao>

        <Secao titulo="Modelo de checklist" erro={errors.modeloId?.message}>
          <EstadoModelos consulta={modelos} />
          {modelos.isSuccess && lista.length === 0 && (
            <EstadoVazio
              icone={ListChecks}
              titulo="Nenhum modelo de checklist disponível"
              descricao="Os modelos da biblioteca (como a RDC 216) deveriam aparecer aqui. Tente recarregar a página."
            />
          )}
          {lista.length > 0 && (
            <ListaModelos
              modelos={lista}
              valor={modeloId}
              onChange={(id) => setValue('modeloId', id, { shouldValidate: true })}
            />
          )}
        </Secao>

        <Secao titulo="Detalhes">
          <div className="flex flex-col gap-1.5">
            <CampoTexto
              rotulo="Data da auditoria"
              type="date"
              autoComplete="off"
              erro={errors.data?.message}
              {...register('data')}
            />
            {data !== hoje && (
              <p className="text-sm text-muted-foreground">
                {data ? 'Não é a data de hoje. ' : ''}
                <button
                  type="button"
                  className="min-h-10 font-medium text-primary underline underline-offset-4"
                  onClick={() => setValue('data', hoje, { shouldValidate: true })}
                >
                  Usar hoje ({formatarData(hoje)})
                </button>
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacoes" className="text-sm">
              Observações (opcional)
            </Label>
            <Textarea
              id="observacoes"
              rows={3}
              className="text-base"
              aria-invalid={errors.observacoes ? true : undefined}
              {...register('observacoes')}
            />
            {errors.observacoes && <p className="text-sm text-destructive">{errors.observacoes.message}</p>}
          </div>
        </Secao>

        {erroGeral && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {erroGeral}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            className="h-12 text-base"
            disabled={!clienteId || !modeloId || criar.isPending}
          >
            {criar.isPending ? 'Criando…' : 'Iniciar auditoria'}
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 text-base">
            <Link to="/auditorias">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
