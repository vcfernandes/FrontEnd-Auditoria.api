import { zodResolver } from '@hookform/resolvers/zod'
import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { useRedefinirSenha } from '@/api/auth'
import { ApiError } from '@/api/client'
import { CampoTexto } from '@/components/CampoTexto'
import { IconeQuadrado } from '@/components/IconeQuadrado'
import { LayoutEntrada } from '@/components/LayoutEntrada'
import { Button } from '@/components/ui/button'
import { aplicarErroApi } from '@/lib/erros'
import { useTokenDaUrl } from '@/lib/tokenDaUrl'

const esquema = z
  .object({
    senha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres').max(72, 'Máximo de 72 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.senha === d.confirmarSenha, { path: ['confirmarSenha'], message: 'As senhas não conferem' })
type Dados = z.infer<typeof esquema>

function LinkInvalido() {
  return (
    <LayoutEntrada titulo="Link inválido">
      <div className="flex flex-col gap-4">
        <IconeQuadrado icone={TriangleAlert} tom="alerta" className="size-14 rounded-xl [&>svg]:size-7" />
        <p>
          Este link para criar uma nova senha não é válido: ele pode ter vencido (1 hora), já ter sido usado ou estar
          incompleto. Peça um novo link.
        </p>
        <Button asChild size="lg" className="h-12 text-base">
          <Link to="/esqueci-senha">Pedir novo link</Link>
        </Button>
      </div>
    </LayoutEntrada>
  )
}

/** Link do e-mail de nova senha: `/redefinir-senha?token=...`. */
export function RedefinirSenhaPage() {
  const token = useTokenDaUrl()
  const navigate = useNavigate()
  const redefinir = useRedefinirSenha()
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Dados>({ resolver: zodResolver(esquema) })

  if (!token || (redefinir.error instanceof ApiError && redefinir.error.codigo === 'LINK_INVALIDO')) {
    return <LinkInvalido />
  }

  const enviar = handleSubmit(({ senha }) => {
    setErroGeral(null)
    redefinir.mutate(
      { token, senha },
      {
        onSuccess: () =>
          navigate('/entrar', { replace: true, state: { aviso: 'Senha alterada. Entre com a nova senha.' } }),
        onError: (erro) => {
          if (erro instanceof ApiError && erro.codigo === 'LINK_INVALIDO') return
          setErroGeral(aplicarErroApi(erro, setError, ['senha']))
        },
      },
    )
  })

  return (
    <LayoutEntrada titulo="Criar nova senha">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <CampoTexto
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          erro={errors.senha?.message}
          {...register('senha')}
        />
        <CampoTexto
          rotulo="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          erro={errors.confirmarSenha?.message}
          {...register('confirmarSenha')}
        />
        <p className="text-sm text-muted-foreground">De 8 a 72 caracteres.</p>
        {erroGeral && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {erroGeral}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 text-base" disabled={redefinir.isPending}>
          {redefinir.isPending ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
      </form>
    </LayoutEntrada>
  )
}
