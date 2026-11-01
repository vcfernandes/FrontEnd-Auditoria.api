import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import {
  useCliente,
  useCriarCliente,
  useEditarCliente,
  useInativarCliente,
  useReativarCliente,
  type Cliente,
  type ClienteDados,
} from '@/api/clientes'
import { ApiError } from '@/api/client'
import { CampoTexto } from '@/components/CampoTexto'
import { EsqueletoFormulario } from '@/components/Esqueletos'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { aplicarErroApi } from '@/lib/erros'
import { mascararCnpj, somenteDigitos } from '@/lib/formatadores'
import { cn } from '@/lib/utils'

const CATEGORIAS = ['Padaria', 'Açougue', 'Restaurante', 'Lanchonete', 'Supermercado', 'Cozinha industrial']

const esquema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do cliente').max(150, 'Máximo de 150 caracteres'),
  cnpj: z.string().refine((v) => v === '' || somenteDigitos(v).length === 14, 'O CNPJ deve ter 14 dígitos'),
  categoria: z.string().trim().max(50, 'Máximo de 50 caracteres'),
})
type Dados = z.infer<typeof esquema>

const CAMPOS_API = ['nome', 'cnpj', 'categoria'] as const

function MensagemGeral({ texto }: { texto: string }) {
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
      {texto}
    </p>
  )
}

function InativarCliente({ cliente }: { cliente: Cliente }) {
  const navigate = useNavigate()
  const inativar = useInativarCliente(cliente.id!)
  const [erro, setErro] = useState<string | null>(null)

  const confirmar = () => {
    setErro(null)
    inativar.mutate(undefined, {
      onSuccess: () => navigate('/clientes', { replace: true }),
      onError: (e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível inativar o cliente.'),
    })
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-6">
      {erro && <MensagemGeral texto={erro} />}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" size="lg" className="h-12 text-base" disabled={inativar.isPending}>
            {inativar.isPending ? 'Inativando…' : 'Inativar cliente'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar {cliente.nome}?</AlertDialogTitle>
            <AlertDialogDescription>O cliente deixará de aparecer na lista de clientes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" className="h-11" onClick={confirmar}>
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ReativarCliente({ cliente }: { cliente: Cliente }) {
  const reativar = useReativarCliente(cliente.id!)
  const [erro, setErro] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3 border-t pt-6">
      {erro && <MensagemGeral texto={erro} />}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 text-base"
        disabled={reativar.isPending}
        onClick={() => {
          setErro(null)
          reativar.mutate(undefined, {
            onError: (e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível reativar o cliente.'),
          })
        }}
      >
        {reativar.isPending ? 'Reativando…' : 'Reativar cliente'}
      </Button>
    </div>
  )
}

function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const navigate = useNavigate()
  const criar = useCriarCliente()
  const editar = useEditarCliente(cliente?.id ?? '')
  const salvando = criar.isPending || editar.isPending
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
    defaultValues: {
      nome: cliente?.nome ?? '',
      cnpj: mascararCnpj(cliente?.cnpj ?? ''),
      categoria: cliente?.categoria ?? '',
    },
  })
  const categoriaAtual = useWatch({ control, name: 'categoria' }).trim()

  const enviar = handleSubmit((dados) => {
    setErroGeral(null)
    const corpo: ClienteDados = {
      nome: dados.nome,
      cnpj: somenteDigitos(dados.cnpj) || undefined,
      categoria: dados.categoria || undefined,
      tipo: 'SIMPLES',
    }
    const aoErrar = (erro: unknown) => {
      // 409: CNPJ já cadastrado — aparece no próprio campo.
      if (erro instanceof ApiError && erro.status === 409) {
        setError('cnpj', { type: 'server', message: erro.message })
        return
      }
      setErroGeral(aplicarErroApi(erro, setError, CAMPOS_API))
    }
    const aoSalvar = () => navigate('/clientes', { replace: true })

    if (cliente) editar.mutate(corpo, { onSuccess: aoSalvar, onError: aoErrar })
    else criar.mutate(corpo, { onSuccess: aoSalvar, onError: aoErrar })
  })

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <CampoTexto
        rotulo="Nome"
        autoComplete="off"
        erro={errors.nome?.message}
        {...register('nome')}
      />

      <Controller
        control={control}
        name="cnpj"
        render={({ field }) => (
          <CampoTexto
            rotulo="CNPJ (opcional)"
            inputMode="numeric"
            autoComplete="off"
            placeholder="00.000.000/0000-00"
            erro={errors.cnpj?.message}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={field.value}
            onChange={(e) => field.onChange(mascararCnpj(e.target.value))}
          />
        )}
      />

      <div className="flex flex-col gap-2">
        <CampoTexto
          rotulo="Categoria (opcional)"
          autoComplete="off"
          placeholder="Escolha abaixo ou digite"
          erro={errors.categoria?.message}
          {...register('categoria')}
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sugestões de categoria">
          {CATEGORIAS.map((categoria) => {
            const ativa = categoriaAtual === categoria
            return (
              <button
                key={categoria}
                type="button"
                aria-pressed={ativa}
                onClick={() => setValue('categoria', ativa ? '' : categoria, { shouldValidate: true })}
                className={cn(
                  'h-10 rounded-full border px-4 text-sm font-medium transition-colors',
                  ativa ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
                )}
              >
                {categoria}
              </button>
            )
          })}
        </div>
      </div>

      {erroGeral && <MensagemGeral texto={erroGeral} />}

      <Button type="submit" size="lg" className="h-12 text-base" disabled={salvando}>
        {salvando ? 'Salvando…' : cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
      </Button>
      <Button asChild variant="outline" size="lg" className="h-12 text-base">
        <Link to="/clientes">Cancelar</Link>
      </Button>

      {cliente && (cliente.ativo !== false ? <InativarCliente cliente={cliente} /> : <ReativarCliente cliente={cliente} />)}
    </form>
  )
}

export function ClienteFormPage() {
  const { id } = useParams()
  const cliente = useCliente(id)

  return (
    <section className="flex flex-col gap-6">
      <h1 className="sr-only">{id ? 'Editar cliente' : 'Novo cliente'}</h1>

      {!id && <ClienteForm />}
      {id && cliente.isPending && <EsqueletoFormulario campos={3} />}
      {id && cliente.isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-destructive">
            {cliente.error instanceof ApiError && cliente.error.status === 404
              ? 'Cliente não encontrado.'
              : cliente.error instanceof ApiError
                ? cliente.error.message
                : 'Não foi possível carregar o cliente.'}
          </p>
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link to="/clientes">Voltar para clientes</Link>
          </Button>
        </div>
      )}
      {id && cliente.isSuccess && <ClienteForm cliente={cliente.data} />}
    </section>
  )
}
